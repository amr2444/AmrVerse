// WebSocket event handlers for reading rooms
import type { Server, Socket } from "socket.io"
import type { ScrollEvent } from "@/lib/types"

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

const roomStates = new Map<string, RoomState>()

export function initializeSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("[v0] User connected:", socket.id)

    // Join a reading room
    socket.on("join-room", (data: { roomCode: string; userId: string; username: string }) => {
      const { roomCode, userId, username } = data
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

    // Handle scroll synchronization
    socket.on("scroll-sync", (data: ScrollEvent) => {
      const rooms = Array.from(socket.rooms)
      const roomCode = rooms.find((r) => r !== socket.id)

      if (roomCode) {
        const roomState = roomStates.get(roomCode)
        if (roomState && roomState.hostId === data.userId) {
          roomState.currentScrollPosition = data.position
          roomState.currentPageNumber = data.pageNumber

          // Broadcast scroll position to all users except sender
          socket.to(roomCode).emit("scroll-update", {
            userId: data.userId,
            position: data.position,
            pageNumber: data.pageNumber,
            timestamp: new Date(),
          })
        }
      }
    })

    // Handle chat messages (handled separately in chat handler)
    socket.on("send-message", (data: { roomCode: string; message: string; userId: string; username: string }) => {
      const { roomCode } = data
      io.to(roomCode).emit("message-received", {
        ...data,
        timestamp: new Date(),
      })
    })

    socket.on("typing-start", (data: { roomCode: string; username: string }) => {
      const { roomCode, username } = data
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

    socket.on("typing-stop", (data: { roomCode: string; username: string }) => {
      const { roomCode, username } = data
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
      const { roomCode } = data
      io.to(roomCode).emit("message-reaction", {
        ...data,
        timestamp: new Date(),
      })
    })

    socket.on("sync-scroll", (data: ScrollEvent) => {
      const rooms = Array.from(socket.rooms)
      const roomCode = rooms.find((r) => r !== socket.id)

      if (roomCode) {
        const roomState = roomStates.get(roomCode)
        if (roomState && roomState.hostId === data.userId) {
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
