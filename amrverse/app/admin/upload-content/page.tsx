"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ImageUploader } from "@/components/image-uploader"
import { BookOpen, Upload, LogOut, Search, Plus, ChevronDown, Check, Trash2, Edit3, Eye, X, AlertTriangle, Layers } from "lucide-react"
import { Logo } from "@/components/logo"
import type { Manhwa, Chapter } from "@/lib/types"

export default function UploadContentPage() {
  const router = useRouter()
  const { user, isLoading, logout, isAuthenticated, token } = useAuth()
  const [mode, setMode] = useState<"select" | "create">("select") // Mode: select existing or create new
  const [existingManhwas, setExistingManhwas] = useState<Manhwa[]>([])
  const [filteredManhwas, setFilteredManhwas] = useState<Manhwa[]>([])
  const [selectedManhwa, setSelectedManhwa] = useState<Manhwa | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoadingManhwas, setIsLoadingManhwas] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Chapter management state
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isLoadingChapters, setIsLoadingChapters] = useState(false)
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const [chapterAction, setChapterAction] = useState<"view" | "edit" | "delete" | null>(null)
  const [isDeletingChapter, setIsDeletingChapter] = useState(false)
  const [isUpdatingChapter, setIsUpdatingChapter] = useState(false)
  const [showChapterManager, setShowChapterManager] = useState(false)
  const [editChapterData, setEditChapterData] = useState({
    title: "",
    description: "",
  })
  
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    coverUrl: "",
    genres: [] as string[],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth")
    }
  }, [isLoading, isAuthenticated, router])

  // Fetch existing manhwas
  useEffect(() => {
    const fetchManhwas = async () => {
      try {
        const response = await fetch("/api/manhwas?page=1&pageSize=100")
        const result = await response.json()
        if (result.success) {
          setExistingManhwas(result.data.data)
          setFilteredManhwas(result.data.data)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch manhwas:", error)
      } finally {
        setIsLoadingManhwas(false)
      }
    }
    fetchManhwas()
  }, [])

  // Filter manhwas based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredManhwas(existingManhwas)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredManhwas(
        existingManhwas.filter(
          (m) =>
            m.title.toLowerCase().includes(query) ||
            (m.author && m.author.toLowerCase().includes(query))
        )
      )
    }
  }, [searchQuery, existingManhwas])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Fetch chapters when a manhwa is selected
  useEffect(() => {
    if (selectedManhwa) {
      fetchChapters(selectedManhwa.id)
    } else {
      setChapters([])
      setShowChapterManager(false)
    }
  }, [selectedManhwa])

  const fetchChapters = async (manhwaId: string) => {
    setIsLoadingChapters(true)
    try {
      const response = await fetch(`/api/manhwas/${manhwaId}/chapters`)
      const result = await response.json()
      if (result.success) {
        setChapters(result.data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch chapters:", error)
    } finally {
      setIsLoadingChapters(false)
    }
  }

  const handleDeleteChapter = async (chapterId: string) => {
    if (!token) return
    
    setIsDeletingChapter(true)
    try {
      const response = await fetch(`/api/chapters/${chapterId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Remove from local state
        setChapters((prev) => prev.filter((c) => c.id !== chapterId))
        setSelectedChapter(null)
        setChapterAction(null)
        // Update manhwa chapter count locally
        if (selectedManhwa) {
          setSelectedManhwa({
            ...selectedManhwa,
            totalChapters: selectedManhwa.totalChapters - 1,
          })
        }
      } else {
        setError(result.error || "Failed to delete chapter")
      }
    } catch (error) {
      console.error("[v0] Failed to delete chapter:", error)
      setError("Failed to delete chapter")
    } finally {
      setIsDeletingChapter(false)
    }
  }

  const handleEditChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter)
    setEditChapterData({
      title: chapter.title || "",
      description: "",  // Chapter description if available
    })
    setChapterAction("edit")
  }

  const handleUpdateChapter = async () => {
    if (!token || !selectedChapter) return
    
    setIsUpdatingChapter(true)
    setError("")
    
    try {
      const response = await fetch(`/api/chapters/${selectedChapter.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editChapterData.title,
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Update local state
        setChapters((prev) => prev.map((c) => 
          c.id === selectedChapter.id 
            ? { ...c, title: editChapterData.title }
            : c
        ))
        setSelectedChapter(null)
        setChapterAction(null)
        setEditChapterData({ title: "", description: "" })
      } else {
        setError(result.error || "Failed to update chapter")
      }
    } catch (error) {
      console.error("[v0] Failed to update chapter:", error)
      setError("Failed to update chapter")
    } finally {
      setIsUpdatingChapter(false)
    }
  }

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <BookOpen className="w-16 h-16 text-primary/50 mx-auto animate-pulse" />
          <p className="text-foreground/60">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated (will redirect via useEffect)
  if (!isAuthenticated) {
    return null
  }

  if (!user?.isCreator && !isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <BookOpen className="w-16 h-16 text-primary/50 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Creator Access Required</h1>
          <p className="text-foreground/60">Contact support to enable creator features on your account</p>
          <Button onClick={() => router.push("/library")} className="mt-4">
            Back to Library
          </Button>
        </div>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCoverUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, coverUrl: url }))
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleSelectManhwa = (manhwa: Manhwa) => {
    setSelectedManhwa(manhwa)
    setSearchQuery(manhwa.title)
    setIsDropdownOpen(false)
  }

  const handleContinueWithSelected = () => {
    if (selectedManhwa) {
      router.push(`/admin/upload-pages?manhwaId=${selectedManhwa.id}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // Create slug from title
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

      // Parse genres from comma-separated string
      const genresInput = (document.getElementById("genres") as HTMLInputElement)?.value || ""
      const genres = genresInput.split(",").map((g) => g.trim()).filter((g) => g)

      const token = localStorage.getItem("amrverse_token")
      const response = await fetch("/api/manhwas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          slug,
          description: formData.description,
          coverUrl: formData.coverUrl,
          author: formData.author,
          genre: genres,
          status: "ongoing",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create manhwa")
      }

      // Success! Redirect to upload pages
      router.push(`/admin/upload-pages?manhwaId=${data.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Logo variant="creator" onClick={() => router.push("/library")} />

          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2 border-primary/40 hover:bg-red-500/10 text-foreground bg-transparent"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Creator Studio</h1>
            <p className="text-foreground/60">Gérez vos manhwas et ajoutez de nouveaux chapitres</p>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-card/40 border border-fuchsia-500/20 rounded-xl">
            <button
              onClick={() => { setMode("select"); setSelectedManhwa(null); setSearchQuery(""); }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                mode === "select"
                  ? "bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg"
                  : "text-foreground/60 hover:text-foreground hover:bg-fuchsia-500/10"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Manhwa Existant
            </button>
            <button
              onClick={() => { setMode("create"); setSelectedManhwa(null); }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                mode === "create"
                  ? "bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg"
                  : "text-foreground/60 hover:text-foreground hover:bg-fuchsia-500/10"
              }`}
            >
              <Plus className="w-4 h-4" />
              Nouveau Manhwa
            </button>
          </div>

          {/* Select Existing Manhwa Mode */}
          {mode === "select" && (
            <div className="bg-card/40 border border-fuchsia-500/20 rounded-xl p-8 backdrop-blur-xl space-y-6">
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Search className="w-5 h-5 text-fuchsia-400" />
                  Sélectionnez un Manhwa
                </h2>
                <p className="text-foreground/60 text-sm">
                  Recherchez et sélectionnez un manhwa existant pour y ajouter des chapitres
                </p>

                {/* Search Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <div 
                    className={`relative flex items-center bg-card/50 border rounded-xl overflow-hidden transition-all duration-300 ${
                      isDropdownOpen ? "border-fuchsia-500/50 ring-2 ring-fuchsia-500/20" : "border-fuchsia-500/20"
                    }`}
                  >
                    <Search className="w-5 h-5 text-foreground/40 ml-4" />
                    <input
                      type="text"
                      placeholder="Rechercher un manhwa..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setSelectedManhwa(null)
                        setIsDropdownOpen(true)
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      className="flex-1 px-4 py-4 bg-transparent text-foreground placeholder-foreground/50 focus:outline-none"
                    />
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="p-4 hover:bg-fuchsia-500/10 transition-colors"
                    >
                      <ChevronDown className={`w-5 h-5 text-foreground/40 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>

                  {/* Dropdown List */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 border border-fuchsia-500/20 rounded-xl shadow-2xl shadow-fuchsia-500/10 overflow-hidden z-50 max-h-80 overflow-y-auto">
                      {isLoadingManhwas ? (
                        <div className="p-6 text-center">
                          <div className="w-6 h-6 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-foreground/50 text-sm">Chargement...</p>
                        </div>
                      ) : filteredManhwas.length === 0 ? (
                        <div className="p-6 text-center">
                          <BookOpen className="w-10 h-10 text-foreground/20 mx-auto mb-2" />
                          <p className="text-foreground/50 text-sm">Aucun manhwa trouvé</p>
                          <button
                            onClick={() => setMode("create")}
                            className="text-fuchsia-400 text-sm mt-2 hover:underline"
                          >
                            Créer un nouveau manhwa
                          </button>
                        </div>
                      ) : (
                        filteredManhwas.map((manhwa) => (
                          <button
                            key={manhwa.id}
                            onClick={() => handleSelectManhwa(manhwa)}
                            className={`w-full flex items-center gap-4 p-4 hover:bg-fuchsia-500/10 transition-colors border-b border-fuchsia-500/10 last:border-b-0 ${
                              selectedManhwa?.id === manhwa.id ? "bg-fuchsia-500/20" : ""
                            }`}
                          >
                            {/* Cover thumbnail */}
                            <div className="w-12 h-16 rounded-lg overflow-hidden bg-fuchsia-500/10 flex-shrink-0">
                              {manhwa.coverUrl ? (
                                <img
                                  src={manhwa.coverUrl}
                                  alt={manhwa.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen className="w-5 h-5 text-fuchsia-400/50" />
                                </div>
                              )}
                            </div>
                            {/* Info */}
                            <div className="flex-1 text-left">
                              <h3 className="font-semibold text-foreground">{manhwa.title}</h3>
                              <p className="text-sm text-foreground/50">{manhwa.author || "Auteur inconnu"}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs px-2 py-0.5 bg-fuchsia-500/20 text-fuchsia-300 rounded-full">
                                  {manhwa.totalChapters} chapitres
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  manhwa.status === "ongoing" 
                                    ? "bg-green-500/20 text-green-300" 
                                    : "bg-blue-500/20 text-blue-300"
                                }`}>
                                  {manhwa.status}
                                </span>
                              </div>
                            </div>
                            {/* Check mark */}
                            {selectedManhwa?.id === manhwa.id && (
                              <Check className="w-5 h-5 text-fuchsia-400" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Manhwa Preview */}
                {selectedManhwa && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-fuchsia-500/10 to-purple-500/10 border border-fuchsia-500/30 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-20 rounded-lg overflow-hidden bg-fuchsia-500/10 flex-shrink-0">
                        {selectedManhwa.coverUrl ? (
                          <img
                            src={selectedManhwa.coverUrl}
                            alt={selectedManhwa.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-fuchsia-400/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-fuchsia-400 font-medium mb-1">Manhwa sélectionné</p>
                        <h3 className="font-bold text-foreground text-lg">{selectedManhwa.title}</h3>
                        <p className="text-sm text-foreground/60">{selectedManhwa.author}</p>
                        <p className="text-xs text-foreground/40 mt-1">{selectedManhwa.totalChapters} chapitres existants</p>
                      </div>
                    </div>

                    {/* Toggle Chapter Manager */}
                    {chapters.length > 0 && (
                      <button
                        onClick={() => setShowChapterManager(!showChapterManager)}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/20 rounded-lg text-fuchsia-300 text-sm font-medium transition-colors"
                      >
                        <Layers className="w-4 h-4" />
                        {showChapterManager ? "Masquer" : "Gérer"} les chapitres ({chapters.length})
                        <ChevronDown className={`w-4 h-4 transition-transform ${showChapterManager ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>
                )}

                {/* Chapter Manager */}
                {selectedManhwa && showChapterManager && (
                  <div className="mt-4 bg-card/60 border border-fuchsia-500/20 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-fuchsia-500/10 border-b border-fuchsia-500/20 flex items-center justify-between">
                      <h3 className="font-bold text-foreground flex items-center gap-2">
                        <Layers className="w-4 h-4 text-fuchsia-400" />
                        Chapitres Existants
                      </h3>
                      <span className="text-xs text-foreground/50">{chapters.length} chapitres</span>
                    </div>

                    {isLoadingChapters ? (
                      <div className="p-8 text-center">
                        <div className="w-6 h-6 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-foreground/50 text-sm">Chargement des chapitres...</p>
                      </div>
                    ) : chapters.length === 0 ? (
                      <div className="p-8 text-center">
                        <BookOpen className="w-10 h-10 text-foreground/20 mx-auto mb-2" />
                        <p className="text-foreground/50 text-sm">Aucun chapitre pour le moment</p>
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto">
                        {chapters.map((chapter) => (
                          <div
                            key={chapter.id}
                            className={`flex items-center gap-4 p-4 border-b border-fuchsia-500/10 last:border-b-0 hover:bg-fuchsia-500/5 transition-colors ${
                              selectedChapter?.id === chapter.id ? "bg-fuchsia-500/10" : ""
                            }`}
                          >
                            {/* Chapter info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-fuchsia-500/20 text-fuchsia-300 flex items-center justify-center text-sm font-bold">
                                  {chapter.chapterNumber}
                                </span>
                                <div>
                                  <h4 className="font-medium text-foreground">
                                    Chapitre {chapter.chapterNumber}
                                    {chapter.title && <span className="text-foreground/60"> - {chapter.title}</span>}
                                  </h4>
                                  <p className="text-xs text-foreground/40">
                                    {chapter.pagesCount} pages • {new Date(chapter.createdAt).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEditChapter(chapter)}
                                className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
                                title="Modifier le chapitre"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => router.push(`/admin/upload-pages?manhwaId=${selectedManhwa.id}&chapterId=${chapter.id}`)}
                                className="p-2 rounded-lg hover:bg-fuchsia-500/20 text-fuchsia-400 transition-colors"
                                title="Gérer les pages"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedChapter(chapter)
                                  setChapterAction("delete")
                                }}
                                className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                title="Supprimer le chapitre"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Delete Confirmation Modal */}
                {chapterAction === "delete" && selectedChapter && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-lg">Supprimer le chapitre ?</h3>
                          <p className="text-foreground/60 text-sm">Cette action est irréversible</p>
                        </div>
                      </div>

                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                        <p className="text-foreground/80 text-sm">
                          Vous êtes sur le point de supprimer le <strong>Chapitre {selectedChapter.chapterNumber}</strong>
                          {selectedChapter.title && <span> - {selectedChapter.title}</span>}.
                        </p>
                        <p className="text-foreground/60 text-xs mt-2">
                          Toutes les pages ({selectedChapter.pagesCount}) et la progression de lecture associées seront supprimées.
                        </p>
                      </div>

                      {error && (
                        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm mb-4">
                          {error}
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button
                          onClick={() => {
                            setSelectedChapter(null)
                            setChapterAction(null)
                            setError("")
                          }}
                          variant="outline"
                          className="flex-1 border-foreground/20 hover:bg-foreground/5 text-foreground bg-transparent"
                          disabled={isDeletingChapter}
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={() => handleDeleteChapter(selectedChapter.id)}
                          disabled={isDeletingChapter}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                        >
                          {isDeletingChapter ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Suppression...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Chapter Modal */}
                {chapterAction === "edit" && selectedChapter && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-blue-500/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Edit3 className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground text-lg">Modifier le Chapitre {selectedChapter.chapterNumber}</h3>
                            <p className="text-foreground/60 text-sm">Modifiez les informations du chapitre</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedChapter(null)
                            setChapterAction(null)
                            setError("")
                          }}
                          className="p-2 rounded-lg hover:bg-foreground/10 text-foreground/60 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        {/* Chapter Title */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground/80">
                            Titre du Chapitre (optionnel)
                          </label>
                          <Input
                            type="text"
                            placeholder="Ex: Le début de l'aventure"
                            value={editChapterData.title}
                            onChange={(e) => setEditChapterData(prev => ({ ...prev, title: e.target.value }))}
                            className="bg-card/50 border-blue-500/20 focus:border-blue-500/50"
                          />
                          <p className="text-xs text-foreground/50">
                            Le titre apparaîtra à côté du numéro de chapitre
                          </p>
                        </div>

                        {/* Chapter Info */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-3">
                          <h4 className="font-semibold text-foreground text-sm">Informations du chapitre</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-foreground/50">Numéro:</span>
                              <span className="text-foreground ml-2 font-medium">{selectedChapter.chapterNumber}</span>
                            </div>
                            <div>
                              <span className="text-foreground/50">Pages:</span>
                              <span className="text-foreground ml-2 font-medium">{selectedChapter.pagesCount}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-foreground/50">Créé le:</span>
                              <span className="text-foreground ml-2 font-medium">
                                {new Date(selectedChapter.createdAt).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground/80">
                            Actions rapides
                          </label>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                setChapterAction(null)
                                router.push(`/admin/upload-pages?manhwaId=${selectedManhwa?.id}&chapterId=${selectedChapter.id}`)
                              }}
                              variant="outline"
                              className="flex-1 border-fuchsia-500/30 hover:bg-fuchsia-500/10 text-fuchsia-300"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Gérer les pages ({selectedChapter.pagesCount})
                            </Button>
                            <Button
                              onClick={() => {
                                setChapterAction(null)
                                router.push(`/admin/upload-pages?manhwaId=${selectedManhwa?.id}&chapterId=${selectedChapter.id}&addPages=true`)
                              }}
                              variant="outline"
                              className="flex-1 border-green-500/30 hover:bg-green-500/10 text-green-300"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Ajouter des pages
                            </Button>
                          </div>
                        </div>
                      </div>

                      {error && (
                        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm mt-4">
                          {error}
                        </div>
                      )}

                      <div className="flex gap-3 mt-6 pt-4 border-t border-foreground/10">
                        <Button
                          onClick={() => {
                            setSelectedChapter(null)
                            setChapterAction(null)
                            setError("")
                          }}
                          variant="outline"
                          className="flex-1 border-foreground/20 hover:bg-foreground/5 text-foreground bg-transparent"
                          disabled={isUpdatingChapter}
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={handleUpdateChapter}
                          disabled={isUpdatingChapter}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                        >
                          {isUpdatingChapter ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Enregistrement...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Enregistrer les modifications
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-6 border-t border-fuchsia-500/20">
                <Button
                  onClick={handleContinueWithSelected}
                  disabled={!selectedManhwa}
                  className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-fuchsia-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Ajouter des Chapitres
                </Button>
              </div>
            </div>
          )}

          {/* Create New Manhwa Mode */}
          {mode === "create" && (
            <div className="bg-card/40 border border-fuchsia-500/20 rounded-xl p-8 backdrop-blur-xl space-y-6">
              {/* Step 1: Basic Info */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white flex items-center justify-center text-sm">
                    1
                  </span>
                  Informations de Base
                </h2>

                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium text-foreground/80">
                    Titre du Manhwa
                  </label>
                  <Input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="Entrez le titre de votre manhwa"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="bg-card/50 border-fuchsia-500/20 focus:border-fuchsia-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="author" className="text-sm font-medium text-foreground/80">
                    Nom de l'Auteur
                  </label>
                  <Input
                    id="author"
                    name="author"
                    type="text"
                    placeholder="Votre nom ou pseudonyme"
                    value={formData.author}
                    onChange={handleInputChange}
                    className="bg-card/50 border-fuchsia-500/20 focus:border-fuchsia-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium text-foreground/80">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Décrivez votre manhwa aux lecteurs..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 bg-card/50 border border-fuchsia-500/20 rounded-lg text-foreground placeholder-foreground/50 focus:border-fuchsia-500/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="genres" className="text-sm font-medium text-foreground/80">
                    Genres (séparés par des virgules)
                  </label>
                  <Input
                    id="genres"
                    name="genres"
                    type="text"
                    placeholder="action, fantasy, aventure"
                    className="bg-card/50 border-fuchsia-500/20 focus:border-fuchsia-500/50"
                  />
                </div>
              </div>

              {/* Step 2: Cover Image */}
              <div className="space-y-4 pt-6 border-t border-fuchsia-500/20">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white flex items-center justify-center text-sm">
                    2
                  </span>
                  Image de Couverture
                </h2>

                <ImageUploader onUpload={handleCoverUpload} />
              </div>

              {/* Error Message */}
              {error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                  {error}
                </div>
              )}

              {/* Step 3: Actions */}
              <div className="pt-6 border-t border-fuchsia-500/20 flex gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.title || !formData.author || !formData.description || !formData.coverUrl || isSubmitting}
                  className="flex-1 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-fuchsia-500/25 disabled:opacity-50"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  {isSubmitting ? "Création..." : "Créer le Manhwa & Ajouter des Chapitres"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
