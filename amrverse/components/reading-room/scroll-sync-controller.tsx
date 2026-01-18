"use client"

import { useEffect, useRef, useCallback } from "react"
import type { ScrollEvent } from "@/lib/types"

interface ScrollSyncControllerProps {
  roomCode: string
  userId: string
  isHost: boolean
  onScroll?: (scrollEvent: ScrollEvent) => void
  pageCount?: number
}

export function ScrollSyncController({ roomCode, userId, isHost, onScroll, pageCount = 1 }: ScrollSyncControllerProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleScroll = useCallback(() => {
    if (!isHost) return

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = setTimeout(() => {
      const scrollPercentage = (window.scrollY / document.documentElement.scrollHeight) * 100
      const currentPage = Math.floor((scrollPercentage / 100) * pageCount)

      const scrollEvent: ScrollEvent = {
        roomId: roomCode,
        userId,
        position: window.scrollY,
        pageNumber: Math.min(currentPage, pageCount - 1),
      }

      if (onScroll) {
        onScroll(scrollEvent)
      }
    }, 100)
  }, [isHost, roomCode, userId, pageCount, onScroll])

  useEffect(() => {
    if (isHost) {
      window.addEventListener("scroll", handleScroll)
      return () => {
        window.removeEventListener("scroll", handleScroll)
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
      }
    }
  }, [isHost, handleScroll])

  return null
}
