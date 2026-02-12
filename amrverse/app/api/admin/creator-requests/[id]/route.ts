// API Admin pour approuver/rejeter une demande créateur
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"

interface ApprovalResponse {
  success: boolean
  message: string
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
      "SELECT is_creator FROM users WHERE id = $1",
      [user.id]
    )

    // TODO: Remplacer par is_admin
    if (!adminUser?.is_creator) {
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

      // TODO: Envoyer un email de confirmation
      console.log(`[CreatorRequest] Approved for user ${creatorRequest.email}`)
      // Implémenter l'envoi d'email ici
    } else {
      console.log(`[CreatorRequest] Rejected for user ${creatorRequest.email}`)
      // TODO: Envoyer un email de rejet
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
