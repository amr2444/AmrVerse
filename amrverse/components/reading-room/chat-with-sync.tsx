"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Send, Smile, MoreVertical } from "lucide-react"

interface Message {
  id: string
  userId: string
  username: string
  message: string
  timestamp: Date
  reactions?: Record<string, number>
}

interface ChatWithSyncProps {
  roomCode: string
  userId: string
  username: string
  onMessage?: (message: Message) => void
  onSync?: (scrollData: { position: number; pageNumber: number }) => void
}

export function ChatWithSync({ roomCode, userId, username, onMessage, onSync }: ChatWithSyncProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true)
      // Emit typing-start event via Socket.IO
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      // Emit typing-stop event via Socket.IO
    }, 3000)
  }, [isTyping])

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      userId,
      username,
      message: messageInput,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setMessageInput("")

    if (onMessage) {
      onMessage(newMessage)
    }

    // Emit message via Socket.IO
  }, [messageInput, userId, username, onMessage])

  return (
    <div className="flex flex-col h-full bg-card/40 border border-primary/20 rounded-lg">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-foreground/50 text-sm text-center mt-8">Start the conversation!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-primary">{msg.username}</span>
                  <span className="text-xs text-foreground/50">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-sm text-foreground/80 break-words">{msg.message}</p>
              {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                <div className="flex gap-1 mt-2">
                  {Object.entries(msg.reactions).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      className="px-2 py-1 bg-card/50 border border-primary/20 rounded text-xs hover:border-primary/50 transition-colors"
                    >
                      {emoji} {count}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {typingUsers.size > 0 && (
          <div className="text-xs text-foreground/50 italic">
            {Array.from(typingUsers).join(", ")} {typingUsers.size === 1 ? "is" : "are"} typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-primary/20 p-3 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Say something..."
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value)
              handleTyping()
            }}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1 px-3 py-2 bg-card/50 border border-primary/20 rounded-lg text-foreground placeholder-foreground/50 focus:border-primary/50 focus:outline-none text-sm"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-primary/40 hover:bg-primary/10 text-foreground bg-transparent"
          >
            <Smile className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-foreground/40">Press Enter to send • Real-time sync enabled</p>
      </div>
    </div>
  )
}
