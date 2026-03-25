import type { AdminCreatorRequest, CreatorRequest, CreatorRequestAuditEntry, Manhwa, ReadingRoom } from "@/lib/types"

function normalizeAuditTrail(value: unknown): CreatorRequestAuditEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((entry: any) => ({
    id: entry.id,
    requestId: entry.requestId || entry.request_id,
    actorUserId: entry.actorUserId || entry.actor_user_id,
    actorUsername: entry.actorUsername || entry.actor_username,
    actorType: entry.actorType || entry.actor_type,
    action: entry.action,
    notes: entry.notes,
    createdAt: entry.createdAt || entry.created_at,
  }))
}

export function mapManhwaRow(row: any): Manhwa {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    coverUrl: row.cover_url,
    author: row.author,
    status: row.status,
    genres: row.genre || [],
    rating: row.rating,
    totalChapters: row.total_chapters,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapReadingRoomRow(row: any): ReadingRoom {
  return {
    id: row.id,
    code: row.code,
    manhwaId: row.manhwa_id,
    chapterId: row.chapter_id,
    hostId: row.host_id,
    roomName: row.room_name,
    currentScrollPosition: row.current_scroll_position || 0,
    currentPageIndex: row.current_page_index || 0,
    isActive: row.is_active,
    maxParticipants: row.max_participants,
    syncEnabled: row.sync_enabled ?? true,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    updatedAt: row.updated_at,
  }
}

export function mapCreatorRequestRow(row: any): CreatorRequest {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    email: row.email,
    presentation: row.presentation,
    motivation: row.motivation,
    portfolioUrl: row.portfolio_url,
    status: row.status,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    adminNotes: row.admin_notes,
    auditTrail: normalizeAuditTrail(row.audit_trail),
  }
}

export function mapAdminCreatorRequestRow(row: any): AdminCreatorRequest {
  return {
    ...mapCreatorRequestRow(row),
    username: row.username,
    displayName: row.display_name,
    reviewedBy: row.reviewed_by_username,
  }
}
