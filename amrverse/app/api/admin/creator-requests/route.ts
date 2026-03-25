// API Admin pour gérer toutes les demandes créateurs
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { getAuthenticatedUser } from "@/lib/auth-request"
import { applyRateLimit, createRateLimitHeaders, getRateLimitIdentifier } from "@/lib/rate-limiter"
import { captureException, logEvent, withRateLimitHeaders } from "@/lib/observability"
import { mapAdminCreatorRequestRow } from "@/lib/server/mappers"
import type { AdminCreatorRequest, ApiResponse } from "@/lib/types"

// GET - Récupérer toutes les demandes (admin uniquement)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<AdminCreatorRequest[]>>> {
  try {
    const user = await getAuthenticatedUser(request, sql)
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 },
      )
    }

    if (!user.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      )
    }

    const { result: rateLimitResult, response: rateLimitResponse } = applyRateLimit(
      request,
      "admin",
      getRateLimitIdentifier(request, user.id),
    )
    if (rateLimitResponse) {
      logEvent({ level: "warn", event: "admin.creator_requests.rate_limited", request, userId: user.id })
      return rateLimitResponse as NextResponse<ApiResponse<AdminCreatorRequest[]>>
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "pending"
    const search = searchParams.get("search")?.trim() || null
    const hasPortfolio = searchParams.get("hasPortfolio") === "true"
    const resubmitted = searchParams.get("resubmitted") === "true"
    const sortBy = searchParams.get("sortBy") === "oldest" ? "ASC" : "DESC"

    const requests = await sql(
      `SELECT cr.*, u.username, u.display_name,
              reviewer.username as reviewed_by_username,
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
       JOIN users u ON cr.user_id = u.id
       LEFT JOIN users reviewer ON cr.reviewed_by = reviewer.id
       LEFT JOIN creator_request_audit_logs cal ON cal.request_id = cr.id
       LEFT JOIN users actor ON actor.id = cal.actor_user_id
       WHERE cr.status = $1
         AND ($2::text IS NULL OR u.username ILIKE $2 OR cr.full_name ILIKE $2 OR cr.email ILIKE $2)
         AND ($3::boolean = FALSE OR cr.portfolio_url IS NOT NULL)
         AND (
           $4::boolean = FALSE OR EXISTS (
             SELECT 1 FROM creator_request_audit_logs cal2
             WHERE cal2.request_id = cr.id AND cal2.action = 'resubmitted'
           )
         )
       GROUP BY cr.id, u.username, u.display_name, reviewer.username
       ORDER BY cr.created_at ${sortBy}`,
      [status, search ? `%${search}%` : null, hasPortfolio, resubmitted]
    )

    const response = NextResponse.json({
      success: true,
      data: requests.map(mapAdminCreatorRequestRow),
    })
    logEvent({ event: "admin.creator_requests.listed", request, userId: user.id, metadata: { status, count: requests.length, search, hasPortfolio, resubmitted, sortBy } })
    return withRateLimitHeaders(response, createRateLimitHeaders(rateLimitResult))
  } catch (error) {
    await captureException({ event: "admin.creator_requests.list_failed", request, error })
    return NextResponse.json(
      { success: false, error: "Failed to fetch requests" },
      { status: 500 },
    )
  }
}
