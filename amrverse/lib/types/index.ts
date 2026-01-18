// Core type definitions for AmrVerse
// Senior-level TypeScript for type safety across the stack

export type UserRole = "user" | "creator" | "admin"
export type RoomStatus = "active" | "archived" | "expired"
export type ManhwaStatus = "ongoing" | "completed" | "hiatus"
export type FriendshipStatus = "pending" | "accepted" | "blocked"

// User types
export interface User {
  id: string
  email: string
  username: string
  displayName?: string
  avatarUrl?: string
  bio?: string
  isCreator: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile extends User {
  favoriteCount: number
  friendCount: number
  totalChaptersRead: number
  createdManhwas?: string[]
}

// Manhwa types
export interface Manhwa {
  id: string
  title: string
  slug: string
  description?: string
  coverUrl?: string
  author?: string
  status: ManhwaStatus
  genres: string[]
  rating: number
  totalChapters: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// Chapter types
export interface Chapter {
  id: string
  manhwaId: string
  chapterNumber: number
  title?: string
  description?: string
  pagesCount: number
  publishedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface ChapterPage {
  id: string
  chapterId: string
  pageNumber: number
  imageUrl: string
  imageHeight?: number
  createdAt: Date
}

// Reading Room types
export interface ReadingRoom {
  id: string
  code: string
  manhwaId: string
  chapterId: string
  hostId: string
  roomName?: string
  currentScrollPosition: number
  currentPageIndex: number
  isActive: boolean
  maxParticipants: number
  syncEnabled: boolean
  updatedAt?: Date
  createdAt: Date
  expiresAt: Date
}

export interface RoomParticipant {
  id: string
  roomId: string
  userId: string
  joinedAt: Date
  lastSeen: Date
}

// Chat and comments types
export interface ChatMessage {
  id: string
  roomId: string
  userId: string
  message: string
  createdAt: Date
}

export interface PanelComment {
  id: string
  chapterPageId: string
  roomId: string
  userId: string
  comment: string
  xPosition?: number
  yPosition?: number
  createdAt: Date
  updatedAt: Date
}

// WebSocket event types
export interface SocketMessage {
  type: "message" | "scroll" | "user_joined" | "user_left" | "panel_comment" | "typing"
  data: Record<string, unknown>
  timestamp: Date
}

export interface ScrollEvent {
  roomId: string
  userId: string
  position: number
  pageNumber: number
}

// Request/Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
