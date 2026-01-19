// WebSocket event handlers for reading rooms - SECURED with JWT authentication
import type { Server, Socket } from "socket.io"
import type { ScrollEvent } from "@/lib/types"
import { verifyAccessToken, type JWTPayload } from "@/lib/auth"
import { sanitizeInput } from "@/lib/validations"

interface RoomState {
  roomId: string
  hostId: string
  currentScrollPosition: number
  currentPageNumber: number
  participants: Map<
    string,
    {
      userId: string
      username: string
      scrollPosition: number
      isTyping: boolean
    }
  >
  isActive: boolean
}

// Extended socket with authenticated user data
interface AuthenticatedSocket extends Socket {
  user?: JWTPayload
}

// Rate limiting for socket events (per socket)
interface SocketRateLimit {
  messageCount: number
  lastReset: number
}

const roomStates = new Map<string, RoomState>()
const socketRateLimits = new Map<string, SocketRateLimit>()

// Socket rate limit config: 30 messages per minute
const SOCKET_RATE_LIMIT = 30
const SOCKET_RATE_WINDOW = 60 * 1000

/**
 * Check if socket has exceeded rate limit
 */
function checkSocketRateLimit(socketId: string): boolean {
  const now = Date.now()
  let rateLimit = socketRateLimits.get(socketId)

  if (!rateLimit || now - rateLimit.lastReset > SOCKET_RATE_WINDOW) {
    rateLimit = { messageCount: 1, lastReset: now }
    socketRateLimits.set(socketId, rateLimit)
    return true
  }

  rateLimit.messageCount++
  if (rateLimit.messageCount > SOCKET_RATE_LIMIT) {
    return false
  }

  return true
}

export function initializeSocketHandlers(io: Server) {
  // SECURITY FIX: Add authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "")

    if (!token) {
      console.log("[Socket] Connection rejected: No token provided")
      return next(new Error("Authentication required"))
    }

    const payload = verifyAccessToken(token)
    if (!payload) {
      console.log("[Socket] Connection rejected: Invalid token")
      return next(new Error("Invalid or expired token"))
    }

    // Attach user info to socket
    socket.user = payload
    next()
  })

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log("[v0] Authenticated user connected:", socket.user?.username, socket.id)

    // Clean up rate limit on disconnect
    socket.on("disconnect", () => {
      socketRateLimits.delete(socket.id)
    })

    // Join a reading room - SECURED: use authenticated user data
    socket.on("join-room", (data: { roomCode: string }) => {
      if (!socket.user) {
        socket.emit("error", { message: "Not authenticated" })
        return
      }

      // Rate limit check
      if (!checkSocketRateLimit(socket.id)) {
        socket.emit("error", { message: "Rate limit exceeded" })
        return
      }

      const { roomCode } = data
      // SECURITY FIX: Use authenticated user data instead of client-provided data
      const userId = socket.user.userId
      const username = socket.user.username

      // Validate room code format
      if (!roomCode || typeof roomCode !== "string" || roomCode.length > 20) {
        socket.emit("error", { message: "Invalid room code" })
        return
      }

      socket.join(roomCode)

      let roomState = roomStates.get(roomCode)
      if (!roomState) {
        roomState = {
          roomId: roomCode,
          hostId: userId,
          currentScrollPosition: 0,
          currentPageNumber: 0,
          participants: new Map(),
          isActive: true,
        }
        roomStates.set(roomCode, roomState)
      }

      roomState.participants.set(socket.id, { userId, username, scrollPosition: 0, isTyping: false })

      // Notify others that user joined
      io.to(roomCode).emit("user-joined", {
        username,
        participantCount: roomState.participants.size,
        timestamp: new Date(),
      })

      // Send current room state to the joining user
      socket.emit("room-state", {
        currentPageNumber: roomState.currentPageNumber,
        currentScrollPosition: roomState.currentScrollPosition,
        participants: Array.from(roomState.participants.values()),
      })

      console.log(`[v0] ${username} joined room ${roomCode}`)
    })

    // Handle scroll synchronization - SECURED
    socket.on("scroll-sync", (data: ScrollEvent) => {
      if (!socket.user) return

      // Rate limit check
      if (!checkSocketRateLimit(socket.id)) {
        socket.emit("error", { message: "Rate limit exceeded" })
        return
      }

      const rooms = Array.from(socket.rooms)
      const roomCode = rooms.find((r) => r !== socket.id)

      if (roomCode) {
        const roomState = roomStates.get(roomCode)
        // SECURITY FIX: Use authenticated userId, not client-provided
        if (roomState && roomState.hostId === socket.user.userId) {
          roomState.currentScrollPosition = data.position
          roomState.currentPageNumber = data.pageNumber

          // Broadcast scroll position to all users except sender
          socket.to(roomCode).emit("scroll-update", {
            userId: socket.user.userId,
            position: data.position,
            pageNumber: data.pageNumber,
            timestamp: new Date(),
          })
        }
      }
    })

    // Handle chat messages - SECURED with sanitization
    socket.on("send-message", (data: { roomCode: string; message: string }) => {
      if (!socket.user) return

      // Rate limit check
      if (!checkSocketRateLimit(socket.id)) {
        socket.emit("error", { message: "Rate limit exceeded" })
        return
      }

      const { roomCode, message } = data

      // Validate and sanitize message
      if (!message || typeof message !== "string" || message.length > 2000) {
        socket.emit("error", { message: "Invalid message" })
        return
      }

      const sanitizedMessage = sanitizeInput(message)

      // SECURITY FIX: Use authenticated user data
      io.to(roomCode).emit("message-received", {
        roomCode,
        message: sanitizedMessage,
        userId: socket.user.userId,
        username: socket.user.username,
        timestamp: new Date(),
      })
    })

    socket.on("typing-start", (data: { roomCode: string }) => {
      if (!socket.user) return

      const { roomCode } = data
      const username = socket.user.username
      const roomState = roomStates.get(roomCode)

      if (roomState) {
        const participant = Array.from(roomState.participants.values()).find((p) => p.username === username)
        if (participant) {
          participant.isTyping = true
        }

        io.to(roomCode).emit("user-typing", {
          username,
          timestamp: new Date(),
        })
      }
    })

    socket.on("typing-stop", (data: { roomCode: string }) => {
      if (!socket.user) return

      const { roomCode } = data
      const username = socket.user.username
      const roomState = roomStates.get(roomCode)

      if (roomState) {
        const participant = Array.from(roomState.participants.values()).find((p) => p.username === username)
        if (participant) {
          participant.isTyping = false
        }

        io.to(roomCode).emit("user-typing-stop", {
          username,
          timestamp: new Date(),
        })
      }
    })

    socket.on("react-message", (data: { roomCode: string; messageId: string; emoji: string }) => {
      if (!socket.user) return

      // Rate limit check
      if (!checkSocketRateLimit(socket.id)) {
        socket.emit("error", { message: "Rate limit exceeded" })
        return
      }

      const { roomCode, messageId, emoji } = data

      // Validate emoji (only allow common emojis)
      const validEmojis = ["👍", "❤️", "😂", "😮", "😢", "😡", "🔥", "👏", "🎉", "💯"]
      if (!validEmojis.includes(emoji)) {
        socket.emit("error", { message: "Invalid emoji" })
        return
      }

      io.to(roomCode).emit("message-reaction", {
        messageId,
        emoji,
        userId: socket.user.userId,
        username: socket.user.username,
        timestamp: new Date(),
      })
    })

    socket.on("sync-scroll", (data: ScrollEvent) => {
      if (!socket.user) return

      // Rate limit check (allow more frequent scroll updates)
      if (!checkSocketRateLimit(socket.id)) {
        return // Silently ignore, don't spam error messages for scroll
      }

      const rooms = Array.from(socket.rooms)
      const roomCode = rooms.find((r) => r !== socket.id)

      if (roomCode) {
        const roomState = roomStates.get(roomCode)
        // SECURITY FIX: Use authenticated userId
        if (roomState && roomState.hostId === socket.user.userId) {
          roomState.currentScrollPosition = data.position
          roomState.currentPageNumber = data.pageNumber

          socket.to(roomCode).emit("host-scrolled", {
            position: data.position,
            pageNumber: data.pageNumber,
            timestamp: new Date(),
          })
        }
      }
    })

    socket.on("get-room-state", (roomCode: string) => {
      const roomState = roomStates.get(roomCode)
      if (roomState) {
        socket.emit("room-state-update", {
          currentPageNumber: roomState.currentPageNumber,
          currentScrollPosition: roomState.currentScrollPosition,
          participants: Array.from(roomState.participants.values()).map((p) => ({
            userId: p.userId,
            username: p.username,
            scrollPosition: p.scrollPosition,
            isTyping: p.isTyping,
          })),
        })
      }
    })

    // Leave room
    socket.on("leave-room", () => {
      const rooms = Array.from(socket.rooms)
      const roomCode = rooms.find((r) => r !== socket.id)

      if (roomCode) {
        const roomState = roomStates.get(roomCode)
        if (roomState) {
          roomState.participants.delete(socket.id)

          io.to(roomCode).emit("user-left", {
            participantCount: roomState.participants.size,
            timestamp: new Date(),
          })

          if (roomState.participants.size === 0) {
            roomStates.delete(roomCode)
          }
        }
      }

      socket.leaveAll()
    })

    socket.on("disconnect", () => {
      const rooms = Array.from(socket.rooms)
      rooms.forEach((room) => {
        const roomState = roomStates.get(room)
        if (roomState) {
          roomState.participants.delete(socket.id)
          if (roomState.participants.size === 0) {
            roomStates.delete(room)
          }
        }
      })
      console.log("[v0] User disconnected:", socket.id)
    })
  })
}

export function getRoomState(roomCode: string): RoomState | undefined {
  return roomStates.get(roomCode)
}
