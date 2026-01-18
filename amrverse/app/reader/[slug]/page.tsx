"use client"

import { useRouter, useParams } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { VerticalScrollReader } from "@/components/vertical-scroll-reader"
import { BookOpen, LogOut, Users, ChevronDown } from "lucide-react"
import { Logo } from "@/components/logo"
import type { Manhwa, Chapter, ChapterPage } from "@/lib/types"

export default function ReaderPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isLoading, logout, isAuthenticated, token } = useAuth()
  const [manhwa, setManhwa] = useState<Manhwa | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const [pages, setPages] = useState<ChapterPage[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [showChapterList, setShowChapterList] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth")
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated && params.slug) {
      fetchManhwa()
    }
  }, [isAuthenticated, params.slug])

  // Save progress periodically
  useEffect(() => {
    if (user && selectedChapter && currentPageIndex > 0) {
      const timer = setTimeout(() => {
        saveProgress()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [currentPageIndex, selectedChapter, user])

  const fetchManhwa = async () => {
    try {
      setIsFetching(true)
      const manhwaSlug = params.slug

      // Fetch manhwa details (supports both slug and ID)
      const manhwaResponse = await fetch(`/api/manhwas/${manhwaSlug}`)
      const manhwaResult = await manhwaResponse.json()

      if (!manhwaResult.success || !manhwaResult.data) {
        console.error("[v0] Failed to fetch manhwa:", manhwaResult.error)
        return
      }

      setManhwa(manhwaResult.data)

      // Fetch chapters using the actual UUID ID, not the slug
      const chaptersResponse = await fetch(`/api/manhwas/${manhwaResult.data.id}/chapters`)
      const chaptersResult = await chaptersResponse.json()

      if (chaptersResult.success) {
        setChapters(chaptersResult.data)
        if (chaptersResult.data.length > 0) {
          setSelectedChapter(chaptersResult.data[0])
          await fetchPages(chaptersResult.data[0].id)
        }
      }
    } catch (error) {
      console.error("[v0] Failed to fetch manhwa:", error)
    } finally {
      setIsFetching(false)
    }
  }

  const fetchPages = async (chapterId: string) => {
    try {
      const response = await fetch(`/api/chapters/${chapterId}/pages`)
      const result = await response.json()
      if (result.success) {
        setPages(result.data)
        // Reset progress for new chapter
        setCurrentPageIndex(0)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch pages:", error)
    }
  }

  const saveProgress = useCallback(async () => {
    if (!user || !selectedChapter) return

    try {
      await fetch("/api/reading-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          chapterId: selectedChapter.id,
          lastPageRead: currentPageIndex,
          completed: currentPageIndex === pages.length - 1,
        }),
      })
    } catch (error) {
      console.error("[v0] Failed to save progress:", error)
    }
  }, [user, selectedChapter, currentPageIndex, pages.length, token])

  const handleChapterChange = async (chapter: Chapter) => {
    setSelectedChapter(chapter)
    await fetchPages(chapter.id)
    setShowChapterList(false)
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleCreateRoom = () => {
    if (selectedChapter) {
      router.push(`/reading-room/create?chapterId=${selectedChapter.id}&manhwaId=${manhwa?.id}`)
    }
  }

  // Vertical scroll reader updates currentPageIndex via IntersectionObserver

  if (!isLoading && !isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Logo onClick={() => router.push("/dashboard")} />

          <div className="text-center flex-1 mx-8">
            <h1 className="font-semibold text-foreground">{manhwa?.title}</h1>
            {selectedChapter && <p className="text-sm text-foreground/60">Chapter {selectedChapter.chapterNumber}</p>}
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleCreateRoom}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white gap-2"
            >
              <Users className="w-4 h-4" />
              Read with Friends
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="gap-2 border-primary/40 hover:bg-red-500/10 text-foreground bg-transparent"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Reader Layout */}
      <div className="flex gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Chapter List - Desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-4">
            <h2 className="text-lg font-bold text-foreground">Chapters</h2>
            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-4">
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => handleChapterChange(chapter)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    selectedChapter?.id === chapter.id
                      ? "bg-primary/30 border border-primary/50 text-foreground"
                      : "bg-card/30 border border-primary/20 text-foreground/70 hover:border-primary/40"
                  }`}
                >
                  <div className="font-medium">Ch. {chapter.chapterNumber}</div>
                  {chapter.title && <div className="text-sm text-foreground/60">{chapter.title}</div>}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Reader */}
        <main className="flex-1">
          {isFetching ? (
            <div className="flex items-center justify-center h-96">
              <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : pages.length > 0 ? (
            <div className="space-y-8">
              {/* Mobile Chapter Selector */}
              <div className="lg:hidden relative">
                <Button
                  onClick={() => setShowChapterList(!showChapterList)}
                  className="w-full flex items-center justify-between bg-card/50 border border-primary/20 text-foreground hover:bg-card/70"
                  variant="outline"
                >
                  <span>Ch. {selectedChapter?.chapterNumber}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showChapterList ? "rotate-180" : ""}`} />
                </Button>
                {showChapterList && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 border border-primary/20 rounded-lg overflow-hidden z-50">
                    {chapters.map((chapter) => (
                      <button
                        key={chapter.id}
                        onClick={() => handleChapterChange(chapter)}
                        className={`w-full text-left px-4 py-2 transition-colors ${
                          selectedChapter?.id === chapter.id
                            ? "bg-primary/30 text-foreground"
                            : "text-foreground/70 hover:bg-card"
                        }`}
                      >
                        Ch. {chapter.chapterNumber}
                        {chapter.title && <div className="text-xs text-foreground/60">{chapter.title}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Webtoon-style Vertical Reader */}
              <VerticalScrollReader
                pages={pages}
                onActiveIndexChange={(idx) => setCurrentPageIndex(idx)}
                className="pb-24"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 text-foreground/60">
              No pages available for this chapter
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
