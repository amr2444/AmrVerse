"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Chapter, Manhwa } from "@/lib/types"
import { createManhwa, deleteChapter, listManhwaChapters, listManhwas, updateChapter, type CreateManhwaInput } from "@/lib/services/manhwa-client"

export type CreatorStudioMode = "select" | "create"

export function useCreatorStudio() {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<CreatorStudioMode>("select")
  const [existingManhwas, setExistingManhwas] = useState<Manhwa[]>([])
  const [selectedManhwa, setSelectedManhwa] = useState<Manhwa | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoadingManhwas, setIsLoadingManhwas] = useState(true)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isLoadingChapters, setIsLoadingChapters] = useState(false)
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const [chapterAction, setChapterAction] = useState<"view" | "edit" | "delete" | null>(null)
  const [isDeletingChapter, setIsDeletingChapter] = useState(false)
  const [isUpdatingChapter, setIsUpdatingChapter] = useState(false)
  const [showChapterManager, setShowChapterManager] = useState(false)
  const [editChapterData, setEditChapterData] = useState({ title: "", description: "" })
  const [formData, setFormData] = useState<CreateManhwaInput>({
    title: "",
    author: "",
    description: "",
    coverUrl: "",
    genres: [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const loadManhwas = useCallback(async () => {
    try {
      const response = await listManhwas(100)
      setExistingManhwas(response.data.data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load manhwas")
    } finally {
      setIsLoadingManhwas(false)
    }
  }, [])

  const loadChapters = useCallback(async (manhwaId: string) => {
    setIsLoadingChapters(true)
    try {
      const response = await listManhwaChapters(manhwaId)
      setChapters(response.data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load chapters")
    } finally {
      setIsLoadingChapters(false)
    }
  }, [])

  useEffect(() => {
    void loadManhwas()
  }, [loadManhwas])

  useEffect(() => {
    if (selectedManhwa) {
      void loadChapters(selectedManhwa.id)
      return
    }

    setChapters([])
    setShowChapterManager(false)
  }, [loadChapters, selectedManhwa])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredManhwas = useMemo(() => {
    if (!searchQuery.trim()) {
      return existingManhwas
    }

    const query = searchQuery.toLowerCase()
    return existingManhwas.filter(
      (manhwa) => manhwa.title.toLowerCase().includes(query) || manhwa.author?.toLowerCase().includes(query),
    )
  }, [existingManhwas, searchQuery])

  const handleInputChange = useCallback((name: keyof CreateManhwaInput, value: string | string[]) => {
    setFormData((current) => ({ ...current, [name]: value }))
  }, [])

  const handleDeleteChapter = useCallback(async (chapterId: string) => {
    setIsDeletingChapter(true)
    try {
      await deleteChapter(chapterId)
      setChapters((current) => current.filter((chapter) => chapter.id !== chapterId))
      setSelectedChapter(null)
      setChapterAction(null)
      setSelectedManhwa((current) =>
        current
          ? {
              ...current,
              totalChapters: current.totalChapters - 1,
            }
          : null,
      )
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete chapter")
    } finally {
      setIsDeletingChapter(false)
    }
  }, [])

  const handleUpdateChapter = useCallback(async () => {
    if (!selectedChapter) return false

    setIsUpdatingChapter(true)
    setError("")

    try {
      await updateChapter(selectedChapter.id, { title: editChapterData.title })
      setChapters((current) =>
        current.map((chapter) =>
          chapter.id === selectedChapter.id ? { ...chapter, title: editChapterData.title } : chapter,
        ),
      )
      setSelectedChapter(null)
      setChapterAction(null)
      setEditChapterData({ title: "", description: "" })
      return true
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update chapter")
      return false
    } finally {
      setIsUpdatingChapter(false)
    }
  }, [editChapterData.title, selectedChapter])

  const handleCreateManhwa = useCallback(async () => {
    setIsSubmitting(true)
    setError("")

    try {
      const response = await createManhwa(formData)
      return response.data.id
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "An error occurred")
      return null
    } finally {
      setIsSubmitting(false)
    }
  }, [formData])

  return {
    dropdownRef,
    mode,
    setMode,
    existingManhwas,
    filteredManhwas,
    selectedManhwa,
    setSelectedManhwa,
    searchQuery,
    setSearchQuery,
    isDropdownOpen,
    setIsDropdownOpen,
    isLoadingManhwas,
    chapters,
    isLoadingChapters,
    selectedChapter,
    setSelectedChapter,
    chapterAction,
    setChapterAction,
    isDeletingChapter,
    isUpdatingChapter,
    showChapterManager,
    setShowChapterManager,
    editChapterData,
    setEditChapterData,
    formData,
    isSubmitting,
    error,
    setError,
    handleInputChange,
    handleDeleteChapter,
    handleUpdateChapter,
    handleCreateManhwa,
  }
}
