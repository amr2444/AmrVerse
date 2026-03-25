// API pour gerer les demandes de statut createur
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { generateAdminActionToken } from "@/lib/auth"
import { getAuthenticatedUserId } from "@/lib/auth-request"
import { sendCreatorRequestToAdmin, sendCreatorSubmissionConfirmationEmail } from "@/lib/email"
import { applyRateLimit, createRateLimitHeaders, getRateLimitIdentifier } from "@/lib/rate-limiter"
import { captureException, logEvent, withRateLimitHeaders } from "@/lib/observability"
import { mapCreatorRequestRow } from "@/lib/server/mappers"
import type { ApiResponse, CreatorRequest } from "@/lib/types"

// GET - Recuperer la demande de l'utilisateur connecte
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<CreatorRequest | null>>> {
  try {
    const userId = getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const [requestData] = await sql(
      `SELECT cr.id, cr.user_id, cr.full_name, cr.email, cr.presentation, cr.motivation,
              cr.portfolio_url, cr.status, cr.admin_notes, cr.created_at, cr.reviewed_at,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', cal.id,
                    'requestId', cal.request_id,
                    'actorUserId', cal.actor_user_id,
                    'actorUsername', actor.username,
                    'actorType', cal.actor_type,
                    'action', cal.action,
                    'notes', cal.notes,
                    'createdAt', cal.created_at
                  ) ORDER BY cal.created_at DESC
                ) FILTER (WHERE cal.id IS NOT NULL),
                '[]'::json
              ) AS audit_trail
       FROM creator_requests cr
       LEFT JOIN creator_request_audit_logs cal ON cal.request_id = cr.id
       LEFT JOIN users actor ON actor.id = cal.actor_user_id
       WHERE cr.user_id = $1
       GROUP BY cr.id`,
      [userId],
    )

    if (!requestData) {
      const response = NextResponse.json({
        success: true,
        data: null,
      })
      logEvent({ event: "creator_request.read_empty", request, userId })
      return response
    }

    logEvent({ event: "creator_request.read", request, userId, metadata: { status: requestData.status } })
    return NextResponse.json({
      success: true,
      data: mapCreatorRequestRow(requestData),
    })
  } catch (error) {
    await captureException({ event: "creator_request.read_failed", request, error })
    return NextResponse.json({ success: false, error: "Failed to fetch request" }, { status: 500 })
  }
}

// POST - Soumettre une nouvelle demande
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<CreatorRequest>>> {
  try {
    const userId = getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { result: rateLimitResult, response: rateLimitResponse } = applyRateLimit(
      request,
      "creator",
      getRateLimitIdentifier(request, userId),
    )
    if (rateLimitResponse) {
      logEvent({ level: "warn", event: "creator_request.rate_limited", request, userId })
      return rateLimitResponse as NextResponse<ApiResponse<CreatorRequest>>
    }

    const payload = await request.json()
    const { fullName, email, presentation, motivation, portfolioUrl } = payload
    logEvent({ event: "creator_request.submit_attempt", request, userId, metadata: { email } })

    if (!fullName || !email || !presentation || !motivation) {
      return NextResponse.json(
        { success: false, error: "Tous les champs obligatoires doivent etre remplis" },
        { status: 400 },
      )
    }

    if (presentation.length < 50) {
      return NextResponse.json(
        { success: false, error: "La presentation doit contenir au moins 50 caracteres" },
        { status: 400 },
      )
    }

    if (motivation.length < 50) {
      return NextResponse.json(
        { success: false, error: "La motivation doit contenir au moins 50 caracteres" },
        { status: 400 },
      )
    }

    const [existing] = await sql("SELECT id, status FROM creator_requests WHERE user_id = $1", [userId])

    if (existing) {
      if (existing.status === "pending") {
        return NextResponse.json(
          { success: false, error: "Vous avez deja une demande en cours de traitement" },
          { status: 400 },
        )
      }

      if (existing.status === "approved") {
        return NextResponse.json({ success: false, error: "Vous etes deja createur" }, { status: 400 })
      }
    }

    const [createdRequest] =
      existing?.status === "rejected"
        ? await sql(
            `UPDATE creator_requests
             SET full_name = $1,
                 email = $2,
                 presentation = $3,
                 motivation = $4,
                 portfolio_url = $5,
                 status = 'pending',
                 admin_notes = NULL,
                 reviewed_by = NULL,
                 reviewed_at = NULL,
                 updated_at = NOW()
             WHERE id = $6
             RETURNING id, user_id, full_name, email, presentation, motivation,
                       portfolio_url, status, admin_notes, created_at, reviewed_at,
                       '[]'::json AS audit_trail`,
            [fullName, email, presentation, motivation, portfolioUrl || null, existing.id],
          )
        : await sql(
            `INSERT INTO creator_requests
             (user_id, full_name, email, presentation, motivation, portfolio_url, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending')
             RETURNING id, user_id, full_name, email, presentation, motivation,
                       portfolio_url, status, admin_notes, created_at, reviewed_at,
                       '[]'::json AS audit_trail`,
            [userId, fullName, email, presentation, motivation, portfolioUrl || null],
          )

    await sql(
      `INSERT INTO creator_request_audit_logs (request_id, actor_user_id, actor_type, action, notes)
       VALUES ($1, $2, 'user', $3, $4)`,
      [createdRequest.id, userId, existing?.status === "rejected" ? "resubmitted" : "submitted", null],
    )

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const approveUrl = `${baseUrl}/api/admin/creator-requests/${createdRequest.id}?action=approve&token=${generateAdminActionToken({ requestId: createdRequest.id, action: "approve" })}`
    const rejectUrl = `${baseUrl}/api/admin/creator-requests/${createdRequest.id}?action=reject&token=${generateAdminActionToken({ requestId: createdRequest.id, action: "reject" })}`

    const emailResult = await sendCreatorRequestToAdmin({
      userName: fullName,
      userEmail: email,
      motivation,
      presentation,
      portfolioUrl,
      requestId: createdRequest.id,
      approveUrl,
      rejectUrl,
      submissionType: existing?.status === "rejected" ? "resubmission" : "initial",
    }).catch((error) => {
      void captureException({
        event: "creator_request.admin_notification_failed",
        request,
        userId,
        error,
        metadata: { requestId: createdRequest.id },
      })
      return { success: false, error: String(error) }
    })

    await sendCreatorSubmissionConfirmationEmail({
      userName: fullName,
      userEmail: email,
      submissionType: existing?.status === "rejected" ? "resubmission" : "initial",
    }).catch((error) => {
      void captureException({
        event: "creator_request.user_confirmation_email_failed",
        request,
        userId,
        error,
        metadata: { requestId: createdRequest.id },
      })
      return { success: false, error: String(error) }
    })

    const message = emailResult.success
      ? existing?.status === "rejected"
        ? "Votre demande a ete renvoyee avec succes. Vous recevrez une reponse par email."
        : "Votre demande a ete envoyee avec succes. Vous recevrez une reponse par email."
      : existing?.status === "rejected"
        ? "Votre demande a ete renvoyee, mais la notification email a l'admin a echoue."
        : "Votre demande a ete enregistree, mais la notification email a l'admin a echoue."

    const response = NextResponse.json(
      {
        success: true,
        data: mapCreatorRequestRow(createdRequest),
        message,
      },
      { status: 201 },
    )
    logEvent({ event: "creator_request.submitted", request, userId, metadata: { requestId: createdRequest.id, emailNotificationSent: emailResult.success } })
    return withRateLimitHeaders(response, createRateLimitHeaders(rateLimitResult))
  } catch (error) {
    await captureException({ event: "creator_request.submit_failed", request, error })
    return NextResponse.json({ success: false, error: "Echec de l'envoi de la demande" }, { status: 500 })
  }
}
