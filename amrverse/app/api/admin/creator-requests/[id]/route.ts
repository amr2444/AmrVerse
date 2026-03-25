import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { verifyAdminActionToken } from "@/lib/auth"
import { sendCreatorApprovalEmail, sendCreatorRejectionEmail } from "@/lib/email"
import { getAuthenticatedUser } from "@/lib/auth-request"
import { applyRateLimit, createRateLimitHeaders, getRateLimitIdentifier } from "@/lib/rate-limiter"
import { captureException, logEvent, withRateLimitHeaders } from "@/lib/observability"
import type { ApiResponse } from "@/lib/types"

interface ApprovalResponse {
  success: boolean
  message: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function renderResultPage(options: {
  title: string
  subtitle: string
  status: "success" | "error" | "info"
  detail?: string
}) {
  const palette =
    options.status === "success"
      ? {
          accent: "#34d399",
          accentSoft: "rgba(52, 211, 153, 0.18)",
          badge: "Approved",
        }
      : options.status === "error"
        ? {
            accent: "#fb7185",
            accentSoft: "rgba(251, 113, 133, 0.18)",
            badge: "Action Failed",
          }
        : {
            accent: "#60a5fa",
            accentSoft: "rgba(96, 165, 250, 0.18)",
            badge: "Already Processed",
          }

  return `<!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(options.title)}</title>
      <style>
        :root {
          color-scheme: dark;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          min-height: 100vh;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background:
            radial-gradient(circle at top left, rgba(99, 102, 241, 0.35), transparent 32%),
            radial-gradient(circle at bottom right, rgba(168, 85, 247, 0.28), transparent 28%),
            linear-gradient(135deg, #0b1020 0%, #171a34 50%, #221749 100%);
          color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 18px;
        }

        .shell {
          width: min(100%, 760px);
          position: relative;
        }

        .glow {
          position: absolute;
          inset: -18px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.32), rgba(168, 85, 247, 0.18));
          filter: blur(26px);
          opacity: 0.9;
          border-radius: 30px;
        }

        .card {
          position: relative;
          overflow: hidden;
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(10, 14, 28, 0.88);
          box-shadow: 0 24px 80px rgba(2, 6, 23, 0.55);
        }

        .hero {
          padding: 28px 28px 22px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background:
            linear-gradient(135deg, rgba(79, 70, 229, 0.28), rgba(147, 51, 234, 0.18)),
            rgba(255, 255, 255, 0.02);
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          border-radius: 999px;
          background: ${palette.accentSoft};
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: ${palette.accent};
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .hero h1 {
          margin: 18px 0 10px;
          font-size: clamp(30px, 4vw, 46px);
          line-height: 1.04;
          letter-spacing: -0.03em;
        }

        .hero p {
          margin: 0;
          color: rgba(226, 232, 240, 0.84);
          font-size: 17px;
          line-height: 1.7;
        }

        .body {
          padding: 26px 28px 30px;
          display: grid;
          gap: 18px;
        }

        .panel {
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 18px 18px 16px;
        }

        .panel-label {
          margin: 0 0 8px;
          color: rgba(148, 163, 184, 0.92);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .panel strong {
          color: #f8fafc;
        }

        .panel p {
          margin: 0;
          color: rgba(226, 232, 240, 0.86);
          line-height: 1.65;
        }

        .meta {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
        }

        .meta-item {
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 15px 16px;
        }

        .meta-item span {
          display: block;
          color: rgba(148, 163, 184, 0.85);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 7px;
        }

        .meta-item strong {
          display: block;
          color: #f8fafc;
          font-size: 16px;
          line-height: 1.45;
          word-break: break-word;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 4px;
        }

        .button {
          appearance: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 46px;
          padding: 0 18px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: #f8fafc;
          text-decoration: none;
          font-weight: 700;
          transition: transform 140ms ease, background 140ms ease, border-color 140ms ease;
        }

        .button:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.08);
        }

        .button.primary {
          background: linear-gradient(135deg, ${palette.accent}, #7c3aed);
          border-color: transparent;
          color: #0b1020;
        }

        .button.primary:hover {
          background: linear-gradient(135deg, #ffffff, ${palette.accent});
        }

        @media (max-width: 640px) {
          .hero,
          .body {
            padding-left: 18px;
            padding-right: 18px;
          }
        }
      </style>
    </head>
    <body>
      <main class="shell">
        <div class="glow"></div>
        <section class="card">
          <header class="hero">
            <div class="badge">${palette.badge}</div>
            <h1>${escapeHtml(options.title)}</h1>
            <p>${escapeHtml(options.subtitle)}</p>
          </header>
          <div class="body">
            ${
              options.detail
                ? `<section class="panel">
                    <p class="panel-label">Detail</p>
                    <p>${escapeHtml(options.detail)}</p>
                  </section>`
                : ""
            }
            <section class="meta">
              <div class="meta-item">
                <span>Plateforme</span>
                <strong>AmrVerse Creator Requests</strong>
              </div>
              <div class="meta-item">
                <span>Etat</span>
                <strong>${escapeHtml(palette.badge)}</strong>
              </div>
            </section>
            <div class="actions">
              <a class="button primary" href="/">Retour a l'accueil</a>
              <a class="button" href="/admin/creator-requests">Voir les demandes</a>
            </div>
          </div>
        </section>
      </main>
    </body>
  </html>`
}

async function insertCreatorRequestAuditLog(options: {
  requestId: string
  actorUserId?: string | null
  actorType: "admin" | "system" | "user"
  action: "submitted" | "resubmitted" | "approved" | "rejected"
  notes?: string | null
}) {
  await sql(
    `INSERT INTO creator_request_audit_logs (request_id, actor_user_id, actor_type, action, notes)
     VALUES ($1, $2, $3, $4, $5)`,
    [options.requestId, options.actorUserId || null, options.actorType, options.action, options.notes || null],
  )
}

function htmlResponse(html: string, status: number) {
  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const token = searchParams.get("token")
    const { id } = await params

    const actionPayload = token ? verifyAdminActionToken(token) : null
    if (!actionPayload || actionPayload.requestId !== id || actionPayload.action !== action) {
      logEvent({ level: "warn", event: "admin.creator_request.email_action_invalid_token", request, metadata: { requestId: id, action } })
      return htmlResponse(
        renderResultPage({
          title: "Acces non autorise",
          subtitle: "Le lien d'action est invalide, expire ou incomplet.",
          status: "error",
          detail: "Verifiez que vous avez ouvert le lien complet depuis l'email admin.",
        }),
        401,
      )
    }

    if (!action || !["approve", "reject"].includes(action)) {
      return htmlResponse(
        renderResultPage({
          title: "Action invalide",
          subtitle: "Cette operation doit etre 'approve' ou 'reject'.",
          status: "error",
        }),
        400,
      )
    }

    const [creatorRequest] = await sql(
      "SELECT user_id, email, full_name, status FROM creator_requests WHERE id = $1",
      [id],
    )

    if (!creatorRequest) {
      return htmlResponse(
        renderResultPage({
          title: "Demande introuvable",
          subtitle: "Cette demande n'existe pas ou a deja ete supprimee.",
          status: "error",
        }),
        404,
      )
    }

    if (creatorRequest.status !== "pending") {
      return htmlResponse(
        renderResultPage({
          title: "Demande deja traitee",
          subtitle:
            creatorRequest.status === "approved"
              ? "Cette demande a deja ete approuvee."
              : "Cette demande a deja ete rejetee.",
          status: "info",
          detail: `Utilisateur concerne: ${creatorRequest.full_name}`,
        }),
        200,
      )
    }

    const newStatus = action === "approve" ? "approved" : "rejected"

     await sql(
       `UPDATE creator_requests
       SET status = $1, reviewed_at = NOW()
       WHERE id = $2`,
       [newStatus, id],
     )

     await insertCreatorRequestAuditLog({
       requestId: id,
       actorType: "system",
       action: action === "approve" ? "approved" : "rejected",
       notes: action === "reject" ? "Action réalisée depuis le lien email admin." : "Action réalisée depuis le lien email admin.",
     })

    if (action === "approve") {
      await sql("UPDATE users SET is_creator = true WHERE id = $1", [creatorRequest.user_id])

      await sendCreatorApprovalEmail({
        userName: creatorRequest.full_name,
        userEmail: creatorRequest.email,
      }).catch((error) => {
        void captureException({
          event: "admin.creator_request.approval_email_failed",
          request,
          error,
          metadata: { requestId: id, targetUserId: creatorRequest.user_id },
        })
      })

      logEvent({ event: "admin.creator_request.approved_via_email", request, metadata: { requestId: id, targetUserId: creatorRequest.user_id } })

      return htmlResponse(
        renderResultPage({
          title: "Demande approuvee",
          subtitle: `${creatorRequest.full_name} est maintenant createur sur AmrVerse.`,
          status: "success",
          detail: `Un email de confirmation a ete envoye a ${creatorRequest.email}.`,
        }),
        200,
      )
    }

    await sendCreatorRejectionEmail({
      userName: creatorRequest.full_name,
      userEmail: creatorRequest.email,
    }).catch((error) => {
      void captureException({
        event: "admin.creator_request.rejection_email_failed",
        request,
        error,
        metadata: { requestId: id, targetUserId: creatorRequest.user_id },
      })
    })

    logEvent({ event: "admin.creator_request.rejected_via_email", request, metadata: { requestId: id, targetUserId: creatorRequest.user_id } })

    return htmlResponse(
      renderResultPage({
        title: "Demande rejetee",
        subtitle: `La demande de ${creatorRequest.full_name} a ete rejetee.`,
        status: "info",
        detail: `Un email de notification a ete envoye a ${creatorRequest.email}.`,
      }),
      200,
    )
  } catch (error) {
    await captureException({ event: "admin.creator_request.email_action_failed", request, error })
    return htmlResponse(
      renderResultPage({
        title: "Erreur serveur",
        subtitle: "Une erreur s'est produite pendant le traitement de la demande.",
        status: "error",
        detail: "Rechargez la page ou repassez par le panel admin.",
      }),
      500,
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<ApprovalResponse>>> {
  try {
    const user = await getAuthenticatedUser(request, sql)
    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    if (!user.isAdmin) {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const { result: rateLimitResult, response: rateLimitResponse } = applyRateLimit(
      request,
      "admin",
      getRateLimitIdentifier(request, user.id),
    )
    if (rateLimitResponse) {
      logEvent({ level: "warn", event: "admin.creator_request.update_rate_limited", request, userId: user.id })
      return rateLimitResponse as NextResponse<ApiResponse<ApprovalResponse>>
    }

    const { id } = await params
    const payload = await request.json()
    const { action, adminNotes } = payload

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Action must be 'approve' or 'reject'" },
        { status: 400 },
      )
    }

    const [creatorRequest] = await sql(
      "SELECT user_id, email, full_name FROM creator_requests WHERE id = $1",
      [id],
    )

    if (!creatorRequest) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 })
    }

    const newStatus = action === "approve" ? "approved" : "rejected"

    await sql(
      `UPDATE creator_requests
       SET status = $1, admin_notes = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4`,
      [newStatus, adminNotes || null, user.id, id],
    )

    await insertCreatorRequestAuditLog({
      requestId: id,
      actorUserId: user.id,
      actorType: "admin",
      action: action === "approve" ? "approved" : "rejected",
      notes: adminNotes || null,
    })

    if (action === "approve") {
      await sql("UPDATE users SET is_creator = true WHERE id = $1", [creatorRequest.user_id])

      await sendCreatorApprovalEmail({
        userName: creatorRequest.full_name,
        userEmail: creatorRequest.email,
      }).catch((error) => {
        void captureException({
          event: "admin.creator_request.approval_email_failed",
          request,
          userId: user.id,
          error,
          metadata: { requestId: id, targetUserId: creatorRequest.user_id },
        })
      })
    } else {
      await sendCreatorRejectionEmail({
        userName: creatorRequest.full_name,
        userEmail: creatorRequest.email,
        reason: adminNotes,
      }).catch((error) => {
        void captureException({
          event: "admin.creator_request.rejection_email_failed",
          request,
          userId: user.id,
          error,
          metadata: { requestId: id, targetUserId: creatorRequest.user_id },
        })
      })
    }

    const response = NextResponse.json({
      success: true,
      data: {
        success: true,
        message:
          action === "approve"
            ? `Demande approuvee. ${creatorRequest.full_name} est maintenant createur.`
            : "Demande rejetee.",
      },
    })
    logEvent({ event: "admin.creator_request.updated", request, userId: user.id, metadata: { requestId: id, action } })
    return withRateLimitHeaders(response, createRateLimitHeaders(rateLimitResult))
  } catch (error) {
    await captureException({ event: "admin.creator_request.update_failed", request, error })
    return NextResponse.json({ success: false, error: "Failed to update request" }, { status: 500 })
  }
}
