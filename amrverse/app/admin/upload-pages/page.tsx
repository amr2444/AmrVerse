"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { BookOpen, Upload, LogOut, Check, X, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"
import { Logo } from "@/components/logo"
import { MultiImageUploader } from "@/components/multi-image-uploader"
import type { Manhwa, Chapter } from "@/lib/types"

const MAX_PAGES_PER_CHAPTER = 20

function UploadPagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading, logout, isAuthenticated } = useAuth()
  const [manhwas, setManhwas] = useState<Manhwa[]>([])
  const [selectedManhwa, setSelectedManhwa] = useState<string>("")
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapter, setSelectedChapter] = useState<string>("")
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showNewChapter, setShowNewChapter] = useState(false)
  const [newChapterData, setNewChapterData] = useState({ number: "", title: "", description: "" })
  const [creatingChapter, setCreatingChapter] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth")
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchManhwas()
    }
  }, [isAuthenticated])

  useEffect(() => {
    // Pre-select manhwa if coming from upload-content
    const manhwaId = searchParams.get("manhwaId")
    const chapterId = searchParams.get("chapterId")
    
    if (manhwaId && manhwas.length > 0) {
      setSelectedManhwa(manhwaId)
      
      // If a chapterId is provided, we'll select it after chapters are loaded
      // Otherwise, show the create chapter form
      if (!chapterId) {
        setShowNewChapter(true) // Auto-show create chapter form only if no chapter specified
      }
    }
  }, [searchParams, manhwas])

  useEffect(() => {
    if (selectedManhwa) {
      fetchChapters(selectedManhwa)
    }
  }, [selectedManhwa])

  // Pre-select chapter if chapterId is in URL params (after chapters are loaded)
  useEffect(() => {
    const chapterId = searchParams.get("chapterId")
    if (chapterId && chapters.length > 0) {
      const chapterExists = chapters.find(c => c.id === chapterId)
      if (chapterExists) {
        setSelectedChapter(chapterId)
        setShowNewChapter(false) // Make sure the form is hidden
      }
    }
  }, [searchParams, chapters])

  const fetchManhwas = async () => {
    try {
      const response = await fetch("/api/manhwas?page=1&pageSize=100")
      const result = await response.json()
      if (result.success) {
        setManhwas(result.data.data)
      }
    } catch (error) {
      console.error("Failed to fetch manhwas:", error)
    }
  }

  const fetchChapters = async (manhwaId: string) => {
    try {
      const response = await fetch(`/api/manhwas/${manhwaId}/chapters`)
      const result = await response.json()
      if (result.success) {
        setChapters(result.data)
      }
    } catch (error) {
      console.error("Failed to fetch chapters:", error)
    }
  }

  // Called when MultiImageUploader finishes uploading all images (for tracking)
  const handleImagesUploaded = (urls: string[]) => {
    setUploadedUrls(urls)
  }

  // Save uploaded pages to database - called by MultiImageUploader
  const handleSaveToDatabase = async (urls: string[]): Promise<boolean> => {
    if (!selectedChapter || urls.length === 0) return false

    try {
      // Create chapter pages in database
      const pagesData = urls.map((url, index) => ({
        pageNumber: index + 1,
        imageUrl: url,
        imageHeight: 800, // Default height
      }))

      const createPagesResponse = await fetch(`/api/chapters/${selectedChapter}/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("amrverse_token")}`,
        },
        body: JSON.stringify({ pages: pagesData }),
      })

      const createPagesResult = await createPagesResponse.json()
      if (createPagesResult.success) {
        setSaveSuccess(true)
        setUploadedUrls(urls)
        // Update chapters list to reflect new page count
        await fetchChapters(selectedManhwa)
        return true
      } else {
        throw new Error(createPagesResult.error || "Failed to create pages in database")
      }
    } catch (error) {
      console.error("Save error:", error)
      alert(`Erreur lors de l'enregistrement: ${error}`)
      return false
    }
  }

  // Reset for new upload
  const handleNewUpload = () => {
    setUploadedUrls([])
    setSaveSuccess(false)
  }

  const handleCreateChapter = async () => {
    if (!selectedManhwa || !newChapterData.number) return

    setCreatingChapter(true)
    try {
      const response = await fetch(`/api/manhwas/${selectedManhwa}/chapters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("amrverse_token")}`,
        },
        body: JSON.stringify({
          chapterNumber: parseInt(newChapterData.number),
          title: newChapterData.title,
          description: newChapterData.description,
        }),
      })

      const result = await response.json()
      if (result.success) {
        await fetchChapters(selectedManhwa)
        setSelectedChapter(result.data.id)
        setShowNewChapter(false)
        setNewChapterData({ number: "", title: "", description: "" })
        alert("Chapter created successfully!")
      } else {
        throw new Error(result.error || "Failed to create chapter")
      }
    } catch (error) {
      console.error("Create chapter error:", error)
      alert(`Failed to create chapter: ${error}`)
    } finally {
      setCreatingChapter(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (!isLoading && !isAuthenticated) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-fuchsia-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/upload-content")}
              className="p-2 rounded-lg hover:bg-fuchsia-500/10 text-foreground/60 hover:text-fuchsia-400 transition-colors"
              title="Retour au Creator Studio"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Logo variant="creator" onClick={() => router.push("/admin/upload-content")} />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="gap-2 border-fuchsia-500/40 hover:bg-red-500/10 text-foreground bg-transparent"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Upload Chapter Pages</h1>
            <p className="text-foreground/60">Ajoutez des pages à vos chapitres de manhwa</p>
          </div>

          {/* Form */}
          <div className="bg-card/40 border border-fuchsia-500/20 rounded-xl p-8 backdrop-blur-xl space-y-6">
            {/* Select Manhwa */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Sélectionner un Manhwa</label>
              <select
                value={selectedManhwa}
                onChange={(e) => {
                  setSelectedManhwa(e.target.value)
                  setSelectedChapter("")
                  setUploadedUrls([])
                  setSaveSuccess(false)
                }}
                className="w-full px-4 py-3 bg-card/50 border border-fuchsia-500/20 rounded-xl text-foreground focus:border-fuchsia-500/50 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 transition-all"
              >
                <option value="">Choisir un manhwa...</option>
                {manhwas.map((manhwa) => (
                  <option key={manhwa.id} value={manhwa.id}>
                    {manhwa.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Chapter */}
            {selectedManhwa && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground/80">Sélectionner un Chapitre</label>
                  <Button
                    onClick={() => setShowNewChapter(!showNewChapter)}
                    variant="outline"
                    size="sm"
                    className="text-xs border-fuchsia-500/40 hover:bg-fuchsia-500/10 text-fuchsia-300"
                  >
                    {showNewChapter ? "Annuler" : "+ Nouveau Chapitre"}
                  </Button>
                </div>

                {showNewChapter ? (
                  <div className="space-y-3 p-4 bg-fuchsia-500/5 rounded-xl border border-fuchsia-500/20">
                    <input
                      type="number"
                      placeholder="Numéro du chapitre"
                      value={newChapterData.number}
                      onChange={(e) => setNewChapterData({ ...newChapterData, number: e.target.value })}
                      className="w-full px-4 py-3 bg-card/50 border border-fuchsia-500/20 rounded-xl text-foreground focus:border-fuchsia-500/50 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 transition-all"
                    />
                    <input
                      type="text"
                      placeholder="Titre du chapitre (optionnel)"
                      value={newChapterData.title}
                      onChange={(e) => setNewChapterData({ ...newChapterData, title: e.target.value })}
                      className="w-full px-4 py-3 bg-card/50 border border-fuchsia-500/20 rounded-xl text-foreground focus:border-fuchsia-500/50 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 transition-all"
                    />
                    <textarea
                      placeholder="Description du chapitre (optionnel)"
                      value={newChapterData.description}
                      onChange={(e) => setNewChapterData({ ...newChapterData, description: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 bg-card/50 border border-fuchsia-500/20 rounded-xl text-foreground focus:border-fuchsia-500/50 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 transition-all"
                    />
                    <Button
                      onClick={handleCreateChapter}
                      disabled={!newChapterData.number || creatingChapter}
                      className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white font-bold rounded-xl"
                    >
                      {creatingChapter ? "Création..." : "Créer le Chapitre"}
                    </Button>
                  </div>
                ) : (
                  <select
                    value={selectedChapter}
                    onChange={(e) => {
                      setSelectedChapter(e.target.value)
                      setUploadedUrls([])
                      setSaveSuccess(false)
                    }}
                    className="w-full px-4 py-3 bg-card/50 border border-fuchsia-500/20 rounded-xl text-foreground focus:border-fuchsia-500/50 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 transition-all"
                  >
                    <option value="">Choisir un chapitre...</option>
                    {chapters.map((chapter) => (
                      <option key={chapter.id} value={chapter.id}>
                        Chapitre {chapter.chapterNumber}: {chapter.title || "Sans titre"}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* File Upload with MultiImageUploader */}
            {selectedChapter && !saveSuccess && (
              <div className="space-y-4 pt-6 border-t border-fuchsia-500/20">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">Uploader des Pages</h2>
                  <span className="text-xs text-foreground/50 bg-fuchsia-500/10 px-3 py-1 rounded-full">
                    Maximum {MAX_PAGES_PER_CHAPTER} pages
                  </span>
                </div>
                
                <p className="text-sm text-foreground/60">
                  Sélectionnez jusqu'à {MAX_PAGES_PER_CHAPTER} images pour ce chapitre. 
                  Vous pouvez réorganiser l'ordre en glissant-déposant les miniatures.
                </p>

                <MultiImageUploader 
                  onUpload={handleImagesUploaded}
                  onUploadComplete={handleSaveToDatabase}
                  maxImages={MAX_PAGES_PER_CHAPTER}
                  disabled={false}
                />
              </div>
            )}

            {/* Success State */}
            {saveSuccess && (
              <div className="space-y-6 pt-6 border-t border-fuchsia-500/20">
                <div className="text-center py-8 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Pages enregistrées avec succès !
                  </h3>
                  <p className="text-foreground/60">
                    {uploadedUrls.length} page(s) ont été ajoutées au chapitre.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleNewUpload}
                    variant="outline"
                    className="flex-1 border-fuchsia-500/40 hover:bg-fuchsia-500/10 text-fuchsia-300"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Uploader plus de pages
                  </Button>
                  <Button
                    onClick={() => router.push("/library")}
                    className="flex-1 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white font-bold rounded-xl"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Voir la bibliothèque
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function UploadPagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-background to-card/20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
      </div>
    }>
      <UploadPagesContent />
    </Suspense>
  )
}
