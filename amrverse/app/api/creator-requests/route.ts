// API pour gérer les demandes de statut créateur
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { getUserIdFromToken } from "@/lib/auth"
import { sendCreatorRequestToAdmin } from "@/lib/email"
import type { ApiResponse } from "@/lib/types"

interface CreatorRequest {
  id: string
  userId: string
  fullName: string
  email: string
  presentation: string
  motivation: string
  portfolioUrl?: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
  reviewedAt?: string
}

// GET - Récupérer la demande de l'utilisateur connecté
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<CreatorRequest | null>>> {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      )
    }

    const userId = getUserIdFromToken(token)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 },
      )
    }

    const [request_data] = await sql(
      `SELECT id, user_id, full_name, email, presentation, motivation, 
              portfolio_url, status, created_at, reviewed_at
       FROM creator_requests
       WHERE user_id = $1`,
      [userId]
    )

    if (!request_data) {
      return NextResponse.json({
        success: true,
        data: null,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: request_data.id,
        userId: request_data.user_id,
        fullName: request_data.full_name,
        email: request_data.email,
        presentation: request_data.presentation,
        motivation: request_data.motivation,
        portfolioUrl: request_data.portfolio_url,
        status: request_data.status,
        createdAt: request_data.created_at,
        reviewedAt: request_data.reviewed_at,
      },
    })
  } catch (error) {
    console.error("[CreatorRequest] GET error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch request" },
      { status: 500 },
    )
  }
}

// POST - Soumettre une nouvelle demande
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<CreatorRequest>>> {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    console.log('[CreatorRequest POST] Token received:', token ? 'YES' : 'NO')
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      )
    }

    const userId = getUserIdFromToken(token)
    console.log('[CreatorRequest POST] UserId extracted:', userId)
    
    if (!userId) {
      console.error('[CreatorRequest POST] Invalid or expired token')
      return NextResponse.json(
        { success: false, error: "Invalid or expired token. Please log out and log in again." },
        { status: 401 },
      )
    }

    const payload = await request.json()
    const { fullName, email, presentation, motivation, portfolioUrl } = payload

    // Validation
    if (!fullName || !email || !presentation || !motivation) {
      return NextResponse.json(
        { success: false, error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 },
      )
    }

    if (presentation.length < 50) {
      return NextResponse.json(
        { success: false, error: "La présentation doit contenir au moins 50 caractères" },
        { status: 400 },
      )
    }

    if (motivation.length < 50) {
      return NextResponse.json(
        { success: false, error: "La motivation doit contenir au moins 50 caractères" },
        { status: 400 },
      )
    }

    // Vérifier si l'utilisateur a déjà une demande
    const [existing] = await sql(
      "SELECT id, status FROM creator_requests WHERE user_id = $1",
      [userId]
    )

    if (existing) {
      if (existing.status === "pending") {
        return NextResponse.json(
          { success: false, error: "Vous avez déjà une demande en cours de traitement" },
          { status: 400 },
        )
      }
      if (existing.status === "approved") {
        return NextResponse.json(
          { success: false, error: "Vous êtes déjà créateur" },
          { status: 400 },
        )
      }
    }

    // Créer la demande
    const [createdRequest] = await sql(
      `INSERT INTO creator_requests 
       (user_id, full_name, email, presentation, motivation, portfolio_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id, user_id, full_name, email, presentation, motivation, 
                 portfolio_url, status, created_at`,
      [userId, fullName, email, presentation, motivation, portfolioUrl || null]
    )

    // Envoyer l'email de notification à l'admin
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const approveUrl = `${baseUrl}/api/admin/creator-requests/${createdRequest.id}?action=approve&token=${process.env.ADMIN_SECRET_TOKEN || 'dev-secret-token'}`
    const rejectUrl = `${baseUrl}/api/admin/creator-requests/${createdRequest.id}?action=reject&token=${process.env.ADMIN_SECRET_TOKEN || 'dev-secret-token'}`

    await sendCreatorRequestToAdmin({
      userName: fullName,
      userEmail: email,
      motivation: motivation,
      presentation: presentation,
      portfolioUrl: portfolioUrl,
      requestId: createdRequest.id,
      approveUrl,
      rejectUrl,
    }).catch(error => {
      console.error('[CreatorRequest] Failed to send admin notification:', error)
      // Ne pas bloquer la création même si l'email échoue
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: createdRequest.id,
          userId: createdRequest.user_id,
          fullName: createdRequest.full_name,
          email: createdRequest.email,
          presentation: createdRequest.presentation,
          motivation: createdRequest.motivation,
          portfolioUrl: createdRequest.portfolio_url,
          status: createdRequest.status,
          createdAt: createdRequest.created_at,
        },
        message: "Votre demande a été envoyée avec succès ! Vous recevrez une réponse par email.",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[CreatorRequest] POST error:", error)
    return NextResponse.json(
      { success: false, error: "Échec de l'envoi de la demande" },
      { status: 500 },
    )
  }
}
