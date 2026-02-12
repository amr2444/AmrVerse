// API Admin pour approuver/rejeter une demande créateur
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"
import { sendCreatorApprovalEmail, sendCreatorRejectionEmail } from "@/lib/email"
import type { ApiResponse } from "@/lib/types"

interface ApprovalResponse {
  success: boolean
  message: string
}

// GET - Approuver ou rejeter depuis un lien email (avec token)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const token = searchParams.get("token")

    // Vérifier le token admin
    const adminToken = process.env.ADMIN_SECRET_TOKEN || 'dev-secret-token'
    if (!token || token !== adminToken) {
      return new NextResponse(
        `<html><body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>❌ Accès non autorisé</h1>
          <p>Token invalide ou manquant.</p>
        </body></html>`,
        { status: 401, headers: { "Content-Type": "text/html" } }
      )
    }

    if (!action || !["approve", "reject"].includes(action)) {
      return new NextResponse(
        `<html><body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>❌ Action invalide</h1>
          <p>L'action doit être 'approve' ou 'reject'.</p>
        </body></html>`,
        { status: 400, headers: { "Content-Type": "text/html" } }
      )
    }

    const { id } = await params

    // Récupérer la demande
    const [creatorRequest] = await sql(
      "SELECT user_id, email, full_name, status FROM creator_requests WHERE id = $1",
      [id]
    )

    if (!creatorRequest) {
      return new NextResponse(
        `<html><body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>❌ Demande introuvable</h1>
          <p>Cette demande n'existe pas.</p>
        </body></html>`,
        { status: 404, headers: { "Content-Type": "text/html" } }
      )
    }

    // Vérifier si déjà traitée
    if (creatorRequest.status !== 'pending') {
      return new NextResponse(
        `<html><body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>ℹ️ Demande déjà traitée</h1>
          <p>Cette demande a déjà été ${creatorRequest.status === 'approved' ? 'approuvée' : 'rejetée'}.</p>
        </body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      )
    }

    const newStatus = action === "approve" ? "approved" : "rejected"

    // Mettre à jour la demande
    await sql(
      `UPDATE creator_requests 
       SET status = $1, reviewed_at = NOW()
       WHERE id = $2`,
      [newStatus, id]
    )

    // Si approuvé, mettre à jour le statut créateur de l'utilisateur
    if (action === "approve") {
      await sql(
        "UPDATE users SET is_creator = true WHERE id = $1",
        [creatorRequest.user_id]
      )

      // Envoyer un email de confirmation
      await sendCreatorApprovalEmail({
        userName: creatorRequest.full_name,
        userEmail: creatorRequest.email,
      }).catch(error => {
        console.error('[CreatorRequest] Failed to send approval email:', error)
      })

      return new NextResponse(
        `<html><body style="font-family: sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div style="background: white; padding: 40px; border-radius: 10px; max-width: 500px; margin: 0 auto;">
            <h1 style="color: #10b981;">✅ Demande approuvée !</h1>
            <p style="font-size: 18px; color: #333;">
              ${creatorRequest.full_name} est maintenant un créateur officiel !
            </p>
            <p style="color: #666;">
              Un email de confirmation a été envoyé à ${creatorRequest.email}
            </p>
          </div>
        </body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      )
    } else {
      // Envoyer un email de rejet
      await sendCreatorRejectionEmail({
        userName: creatorRequest.full_name,
        userEmail: creatorRequest.email,
      }).catch(error => {
        console.error('[CreatorRequest] Failed to send rejection email:', error)
      })

      return new NextResponse(
        `<html><body style="font-family: sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div style="background: white; padding: 40px; border-radius: 10px; max-width: 500px; margin: 0 auto;">
            <h1 style="color: #6b7280;">❌ Demande rejetée</h1>
            <p style="font-size: 18px; color: #333;">
              La demande de ${creatorRequest.full_name} a été rejetée.
            </p>
            <p style="color: #666;">
              Un email de notification a été envoyé à ${creatorRequest.email}
            </p>
          </div>
        </body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      )
    }
  } catch (error) {
    console.error("[Admin CreatorRequest] GET error:", error)
    return new NextResponse(
      `<html><body style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1>❌ Erreur serveur</h1>
        <p>Une erreur s'est produite lors du traitement de la demande.</p>
      </body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    )
  }
}

// PATCH - Approuver ou rejeter une demande
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ApprovalResponse>>> {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      )
    }

    const user = await getUserFromToken(token, sql)
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 },
      )
    }

    // Vérifier si admin
    const [adminUser] = await sql(
      "SELECT is_admin FROM users WHERE id = $1",
      [user.id]
    )

    if (!adminUser?.is_admin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      )
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

    // Récupérer la demande
    const [creatorRequest] = await sql(
      "SELECT user_id, email, full_name FROM creator_requests WHERE id = $1",
      [id]
    )

    if (!creatorRequest) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 },
      )
    }

    const newStatus = action === "approve" ? "approved" : "rejected"

    // Mettre à jour la demande
    await sql(
      `UPDATE creator_requests 
       SET status = $1, admin_notes = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4`,
      [newStatus, adminNotes || null, user.id, id]
    )

    // Si approuvé, mettre à jour le statut créateur de l'utilisateur
    if (action === "approve") {
      await sql(
        "UPDATE users SET is_creator = true WHERE id = $1",
        [creatorRequest.user_id]
      )

      // Envoyer un email de confirmation
      await sendCreatorApprovalEmail({
        userName: creatorRequest.full_name,
        userEmail: creatorRequest.email,
      }).catch(error => {
        console.error('[CreatorRequest] Failed to send approval email:', error)
      })

      console.log(`[CreatorRequest] Approved for user ${creatorRequest.email}`)
    } else {
      // Envoyer un email de rejet
      await sendCreatorRejectionEmail({
        userName: creatorRequest.full_name,
        userEmail: creatorRequest.email,
        reason: adminNotes,
      }).catch(error => {
        console.error('[CreatorRequest] Failed to send rejection email:', error)
      })

      console.log(`[CreatorRequest] Rejected for user ${creatorRequest.email}`)
    }

    return NextResponse.json({
      success: true,
      data: {
        success: true,
        message: action === "approve" 
          ? `Demande approuvée ! ${creatorRequest.full_name} est maintenant créateur.`
          : `Demande rejetée.`,
      },
    })
  } catch (error) {
    console.error("[Admin CreatorRequest] PATCH error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update request" },
      { status: 500 },
    )
  }
}
