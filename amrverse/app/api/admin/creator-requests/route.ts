// API Admin pour gérer toutes les demandes créateurs
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"

interface AdminCreatorRequest {
  id: string
  userId: string
  username: string
  displayName: string
  fullName: string
  email: string
  presentation: string
  motivation: string
  portfolioUrl?: string
  status: "pending" | "approved" | "rejected"
  adminNotes?: string
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
}

// GET - Récupérer toutes les demandes (admin uniquement)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<AdminCreatorRequest[]>>> {
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

    // Vérifier si l'utilisateur est admin (vous devrez ajouter un champ is_admin dans la table users)
    // Pour l'instant, on vérifie juste s'il est créateur
    const [adminUser] = await sql(
      "SELECT is_creator FROM users WHERE id = $1",
      [user.id]
    )

    // TODO: Remplacer par is_admin quand vous ajouterez cette colonne
    if (!adminUser?.is_creator) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "pending"

    const requests = await sql(
      `SELECT cr.*, u.username, u.display_name,
              reviewer.username as reviewed_by_username
       FROM creator_requests cr
       JOIN users u ON cr.user_id = u.id
       LEFT JOIN users reviewer ON cr.reviewed_by = reviewer.id
       WHERE cr.status = $1
       ORDER BY cr.created_at DESC`,
      [status]
    )

    return NextResponse.json({
      success: true,
      data: requests.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        username: r.username,
        displayName: r.display_name,
        fullName: r.full_name,
        email: r.email,
        presentation: r.presentation,
        motivation: r.motivation,
        portfolioUrl: r.portfolio_url,
        status: r.status,
        adminNotes: r.admin_notes,
        reviewedBy: r.reviewed_by_username,
        reviewedAt: r.reviewed_at,
        createdAt: r.created_at,
      })),
    })
  } catch (error) {
    console.error("[Admin CreatorRequests] GET error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch requests" },
      { status: 500 },
    )
  }
}
