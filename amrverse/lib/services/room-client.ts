import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client"
import type { ChapterPage, PanelComment, ReadingRoom } from "@/lib/types"

export interface RoomMessage {
  id: string
  roomId: string
  userId: string
  username: string
  message: string
  createdAt: string
}

export interface RoomParticipantView {
  id: string
  roomId: string
  userId: string
  username?: string
  joinedAt?: string
  lastSeen?: string
}

export function getRoomByCode(code: string) {
  return apiGet<ReadingRoom[]>("/api/reading-rooms", { code })
}

export function getChapterPages(chapterId: string) {
  return apiGet<ChapterPage[]>(`/api/chapters/${chapterId}/pages`)
}

export function joinRoom(roomId: string) {
  return apiPost("/api/room-participants", { roomId })
}

export function getRoomParticipants(roomId: string) {
  return apiGet<RoomParticipantView[]>("/api/room-participants", { roomId })
}

export function getRoomMessages(roomId: string) {
  return apiGet<RoomMessage[]>("/api/chat-messages", { roomId })
}

export function sendRoomMessage(roomId: string, message: string) {
  return apiPost<RoomMessage>("/api/chat-messages", { roomId, message })
}

export function getPanelComments(pageId: string, roomId: string) {
  return apiGet<PanelComment[]>("/api/panel-comments", { pageId, roomId })
}

export function createPanelComment(payload: {
  chapterPageId: string
  roomId: string
  comment: string
  xPosition?: number
  yPosition?: number
}) {
  return apiPost<PanelComment>("/api/panel-comments", payload)
}

export function syncRoomPosition(roomId: string, scrollPosition: number, currentPageIndex: number) {
  return apiPatch<ReadingRoom>("/api/reading-rooms", { roomId, scrollPosition, currentPageIndex })
}

export function deleteRoom(roomId: string) {
  return apiDelete<{ deleted: boolean }>("/api/reading-rooms", { roomId })
}
