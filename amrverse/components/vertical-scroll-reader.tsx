"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { ChapterPage, PanelComment } from "@/lib/types"
import { MessageCircle, X, Send } from "lucide-react"

interface PanelCommentWithUser extends PanelComment {
  username?: string
}

interface VerticalScrollReaderProps {
  pages: ChapterPage[]
  /** Called when the most visible page changes */
  onActiveIndexChange?: (index: number) => void
  /** Optional: start by scrolling to this index */
  initialIndex?: number
  /** Wrap class */
  className?: string
  /** Panel comments to display */
  comments?: PanelCommentWithUser[]
  /** Enable comment mode (clicking on panels to add comments) */
  commentMode?: boolean
  /** Called when user clicks on a panel to add a comment */
  onAddComment?: (pageId: string, pageIndex: number, xPercent: number, yPercent: number, comment: string) => void
}

/**
 * Webtoon-style vertical reader.
 * - Renders all pages in a single scroll column
 * - Tracks the currently active page via IntersectionObserver
 * - Uses lazy-loading + decoding hints for snappy UX
 * - Supports contextual comments on panels
 */
export function VerticalScrollReader({ 
  pages, 
  onActiveIndexChange, 
  initialIndex = 0, 
  className,
  comments = [],
  commentMode = false,
  onAddComment
}: VerticalScrollReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Array<HTMLDivElement | null>>([])
  const [activeIndex, setActiveIndex] = useState(0)
  
  // Comment interaction state
  const [clickPosition, setClickPosition] = useState<{ pageId: string; pageIndex: number; x: number; y: number } | null>(null)
  const [newComment, setNewComment] = useState("")
  const [hoveredComment, setHoveredComment] = useState<string | null>(null)

  const safeInitialIndex = useMemo(() => {
    if (!pages.length) return 0
    return Math.min(Math.max(0, initialIndex), pages.length - 1)
  }, [pages.length, initialIndex])

  // Initial scroll to a given page (useful when resuming) - DISABLED to prevent scroll jumping
  // This was causing the page to jump back to the first page
  const hasInitializedRef = useRef(false)
  useEffect(() => {
    if (!pages.length) return
    if (hasInitializedRef.current) return // Prevent re-running
    
    hasInitializedRef.current = true
    setActiveIndex(safeInitialIndex)
    onActiveIndexChange?.(safeInitialIndex)
    
    // REMOVED: scrollIntoView was causing unwanted page jumps
    // const el = itemRefs.current[safeInitialIndex]
    // if (el) {
    //   requestAnimationFrame(() => el.scrollIntoView({ behavior: "auto", block: "start" }))
    // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages.length])

  // Observe page visibility to compute the active page
  useEffect(() => {
    if (!pages.length) return
    const root = null // viewport

    const observer = new IntersectionObserver(
      (entries) => {
        // pick the most visible entry
        let best: { idx: number; ratio: number } | null = null
        for (const entry of entries) {
          const idx = Number((entry.target as HTMLElement).dataset.index)
          if (Number.isNaN(idx)) continue
          if (!best || entry.intersectionRatio > best.ratio) {
            best = { idx, ratio: entry.intersectionRatio }
          }
        }
        if (best && best.idx !== activeIndex) {
          setActiveIndex(best.idx)
          onActiveIndexChange?.(best.idx)
        }
      },
      {
        root,
        // A page becomes "active" when it takes a meaningful portion of the viewport
        threshold: [0.15, 0.25, 0.35, 0.5, 0.65, 0.8],
        rootMargin: "-10% 0px -55% 0px",
      },
    )

    for (const el of itemRefs.current) {
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages.length, activeIndex])

  // Handle click on page to add comment
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>, pageId: string, pageIndex: number) => {
    if (!commentMode || !onAddComment) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100
    
    setClickPosition({ pageId, pageIndex, x: xPercent, y: yPercent })
    setNewComment("")
  }

  // Submit comment
  const handleSubmitComment = () => {
    if (!clickPosition || !newComment.trim() || !onAddComment) return
    
    onAddComment(clickPosition.pageId, clickPosition.pageIndex, clickPosition.x, clickPosition.y, newComment.trim())
    setClickPosition(null)
    setNewComment("")
  }

  // Cancel comment
  const handleCancelComment = () => {
    setClickPosition(null)
    setNewComment("")
  }

  // Get comments for a specific page
  const getPageComments = (pageId: string) => {
    return comments.filter(c => c.chapterPageId === pageId)
  }

  return (
    <div ref={containerRef} className={className}>
      <div className="space-y-4">
        {pages.map((p, idx) => {
          const pageComments = getPageComments(p.id)
          
          return (
            <div
              key={p.id}
              data-index={idx}
              ref={(el) => {
                itemRefs.current[idx] = el
              }}
              className={`relative bg-card/30 border border-primary/20 rounded-lg overflow-hidden ${
                commentMode ? "cursor-crosshair" : ""
              }`}
              onClick={(e) => handlePageClick(e, p.id, idx)}
            >
              <img
                src={p.imageUrl || "/placeholder.svg"}
                alt={`Page ${p.pageNumber}`}
                loading={idx < 2 ? "eager" : "lazy"}
                decoding="async"
                className="w-full h-auto object-contain select-none"
                draggable={false}
              />
              
              {/* Comment markers */}
              {pageComments.map((comment) => (
                <div
                  key={comment.id}
                  className="absolute group"
                  style={{
                    left: `${comment.xPosition || 0}%`,
                    top: `${comment.yPosition || 0}%`,
                    transform: "translate(-50%, -50%)"
                  }}
                  onMouseEnter={() => setHoveredComment(comment.id)}
                  onMouseLeave={() => setHoveredComment(null)}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Marker dot */}
                  <div className="w-6 h-6 rounded-full bg-fuchsia-500 border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                    <MessageCircle className="w-3 h-3 text-white" />
                  </div>
                  
                  {/* Comment tooltip */}
                  {hoveredComment === comment.id && (
                    <div className="absolute left-8 top-0 z-50 min-w-[200px] max-w-[300px] bg-card/95 backdrop-blur-sm border border-fuchsia-500/30 rounded-lg p-3 shadow-xl">
                      <p className="text-xs font-medium text-fuchsia-400 mb-1">
                        {comment.username || "User"}
                      </p>
                      <p className="text-sm text-foreground/90">{comment.comment}</p>
                      <p className="text-xs text-foreground/40 mt-2">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              
              {/* New comment form (appears when clicking) */}
              {clickPosition?.pageId === p.id && (
                <div
                  className="absolute z-50"
                  style={{
                    left: `${clickPosition.x}%`,
                    top: `${clickPosition.y}%`,
                    transform: "translate(-50%, -50%)"
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Position marker */}
                  <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-lg animate-pulse" />
                  
                  {/* Comment input form */}
                  <div className="absolute left-6 top-0 min-w-[250px] bg-card border border-green-500/30 rounded-lg p-3 shadow-2xl">
                    <p className="text-xs font-medium text-green-400 mb-2 flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      Ajouter un commentaire
                    </p>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Votre commentaire..."
                      className="w-full px-3 py-2 bg-background/50 border border-primary/20 rounded-lg text-foreground placeholder-foreground/50 focus:border-green-500/50 focus:outline-none text-sm resize-none"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleCancelComment}
                        className="flex-1 px-3 py-1.5 text-xs bg-card border border-foreground/20 rounded-lg hover:bg-foreground/10 text-foreground transition-colors flex items-center justify-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Annuler
                      </button>
                      <button
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim()}
                        className="flex-1 px-3 py-1.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        Publier
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Comment mode indicator */}
              {commentMode && idx === activeIndex && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-fuchsia-500/80 text-white text-xs rounded-full flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  Cliquez pour commenter
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Floating progress pill */}
      {pages.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30">
          <div className="px-4 py-2 rounded-full bg-background/70 backdrop-blur-xl border border-primary/20 shadow-lg shadow-primary/10 text-xs text-foreground/80">
            Page <span className="text-foreground font-semibold">{activeIndex + 1}</span> / {pages.length}
          </div>
        </div>
      )}
    </div>
  )
}
