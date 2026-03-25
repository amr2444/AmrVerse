"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { Socket } from "socket.io-client"
import { closeSocket, initializeSocket } from "@/lib/socket-client"

interface RealtimeMessageEvent {
  roomCode: string
  message: string
  userId: string
  username: string
  timestamp: string | Date
}

interface RealtimeRoomState {
  currentPageNumber: number
  currentScrollPosition: number
  participants: Array<{
    userId: string
    username: string
    scrollPosition?: number
    isTyping?: boolean
  }>
}

export function useRoomRealtime({
  roomCode,
  enabled,
  onRemoteMessage,
  onPresenceChanged,
  onRoomState,
  onHostScroll,
}: {
  roomCode: string
  enabled: boolean
  onRemoteMessage: (event: RealtimeMessageEvent) => void
  onPresenceChanged: () => void
  onRoomState: (state: RealtimeRoomState) => void
  onHostScroll: (position: number, pageNumber: number) => void
}) {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!enabled || !roomCode) {
      return
    }

    const socket = initializeSocket()
    socketRef.current = socket

    const handleConnect = () => {
      setIsConnected(true)
      socket.emit("join-room", { roomCode })
      socket.emit("get-room-state", roomCode)
    }

    const handleDisconnect = () => setIsConnected(false)
    const handleUserJoined = () => onPresenceChanged()
    const handleUserLeft = () => onPresenceChanged()
    const handleMessage = (event: RealtimeMessageEvent) => onRemoteMessage(event)
    const handleRoomState = (state: RealtimeRoomState) => {
      onRoomState(state)
      onPresenceChanged()
    }
    const handleRoomStateUpdate = (state: RealtimeRoomState) => onRoomState(state)
    const handleHostScrolled = (payload: { position: number; pageNumber: number }) => {
      onHostScroll(payload.position, payload.pageNumber)
    }

    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)
    socket.on("user-joined", handleUserJoined)
    socket.on("user-left", handleUserLeft)
    socket.on("message-received", handleMessage)
    socket.on("room-state", handleRoomState)
    socket.on("room-state-update", handleRoomStateUpdate)
    socket.on("host-scrolled", handleHostScrolled)

    if (socket.connected) {
      handleConnect()
    }

    return () => {
      socket.emit("leave-room")
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
      socket.off("user-joined", handleUserJoined)
      socket.off("user-left", handleUserLeft)
      socket.off("message-received", handleMessage)
      socket.off("room-state", handleRoomState)
      socket.off("room-state-update", handleRoomStateUpdate)
      socket.off("host-scrolled", handleHostScrolled)
      setIsConnected(false)
    }
  }, [enabled, onHostScroll, onPresenceChanged, onRemoteMessage, onRoomState, roomCode])

  const apiMode = useMemo(() => !isConnected, [isConnected])

  return {
    isConnected,
    apiMode,
    broadcastScroll(position: number, pageNumber: number) {
      socketRef.current?.emit("sync-scroll", { roomId: roomCode, userId: "", position, pageNumber })
    },
    close() {
      closeSocket()
    },
  }
}
