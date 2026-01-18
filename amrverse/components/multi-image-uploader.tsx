"use client"

import type React from "react"
import { useRef, useState, useCallback } from "react"
import { Upload, X, Loader2, Check, GripVertical, AlertCircle, Images } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageFile {
  id: string
  file: File
  preview: string
  uploadedUrl?: string
  uploading: boolean
  error?: string
}

interface MultiImageUploaderProps {
  onUpload: (urls: string[]) => void
  onUploadComplete?: (urls: string[]) => Promise<boolean>  // Called after all uploads, returns success
  maxImages?: number
  disabled?: boolean
  autoSave?: boolean  // If true, calls onUploadComplete automatically after upload
}

export function MultiImageUploader({ 
  onUpload, 
  onUploadComplete,
  maxImages = 20, 
  disabled = false,
  autoSave = false
}: MultiImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<ImageFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveComplete, setSaveComplete] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const generateId = () => Math.random().toString(36).substring(7)

  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    
    // Filter and validate files
    const validFiles = fileArray.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        console.warn(`Invalid file type: ${file.name}`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) {
        console.warn(`File too large: ${file.name}`)
        return false
      }
      return true
    })

    // Check max limit
    const remainingSlots = maxImages - images.length
    const filesToAdd = validFiles.slice(0, remainingSlots)

    if (validFiles.length > remainingSlots) {
      alert(`Vous ne pouvez ajouter que ${remainingSlots} image(s) supplémentaire(s). Maximum ${maxImages} pages par chapitre.`)
    }

    // Sort files by name for correct page order
    filesToAdd.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

    // Create image objects with previews
    const newImages: ImageFile[] = filesToAdd.map(file => ({
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
    }))

    setImages(prev => [...prev, ...newImages])
  }, [images.length, maxImages])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files)
    }
    // Reset input to allow selecting same files again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files)
    }
  }, [handleFileSelect])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const removeImage = (id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id)
      if (image) {
        URL.revokeObjectURL(image.preview)
      }
      return prev.filter(img => img.id !== id)
    })
  }

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview))
    setImages([])
    setUploadProgress(null)
  }

  // Drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    setImages(prev => {
      const newImages = [...prev]
      const draggedImage = newImages[draggedIndex]
      newImages.splice(draggedIndex, 1)
      newImages.splice(index, 0, draggedImage)
      return newImages
    })
    setDraggedIndex(index)
  }

  const uploadAllImages = async () => {
    if (images.length === 0) return

    setUploading(true)
    setUploadProgress({ current: 0, total: images.length })
    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        
        // Skip already uploaded images
        if (image.uploadedUrl) {
          uploadedUrls.push(image.uploadedUrl)
          setUploadProgress({ current: i + 1, total: images.length })
          continue
        }

        // Mark as uploading
        setImages(prev => prev.map((img, idx) => 
          idx === i ? { ...img, uploading: true, error: undefined } : img
        ))

        try {
          const formData = new FormData()
          formData.append("file", image.file)

          const response = await fetch("/api/upload", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("amrverse_token")}`,
            },
            body: formData,
          })

          const result = await response.json()

          if (result.success) {
            uploadedUrls.push(result.data.url)
            setImages(prev => prev.map((img, idx) => 
              idx === i ? { ...img, uploading: false, uploadedUrl: result.data.url } : img
            ))
          } else {
            throw new Error(result.error || "Upload failed")
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Upload failed"
          setImages(prev => prev.map((img, idx) => 
            idx === i ? { ...img, uploading: false, error: errorMsg } : img
          ))
          // Continue with other uploads even if one fails
        }

        setUploadProgress({ current: i + 1, total: images.length })
      }

      // Call onUpload with all successfully uploaded URLs
      if (uploadedUrls.length > 0) {
        onUpload(uploadedUrls)
        
        // If autoSave is enabled and onUploadComplete is provided, save automatically
        if (autoSave && onUploadComplete && uploadedUrls.length === images.length) {
          setSaving(true)
          try {
            const success = await onUploadComplete(uploadedUrls)
            if (success) {
              setSaveComplete(true)
            }
          } catch (err) {
            console.error("Save error:", err)
            alert("Erreur lors de l'enregistrement des pages")
          } finally {
            setSaving(false)
          }
        }
      }

      if (uploadedUrls.length === images.length) {
        // All uploads successful
        return true
      } else {
        // Some uploads failed
        alert(`${uploadedUrls.length}/${images.length} images uploadées. Certaines ont échoué.`)
        return false
      }
    } finally {
      setUploading(false)
    }
  }

  // Manual save function (when autoSave is false)
  const saveToDatabase = async () => {
    const urls = images.filter(img => img.uploadedUrl).map(img => img.uploadedUrl!)
    if (urls.length === 0 || !onUploadComplete) return

    setSaving(true)
    try {
      const success = await onUploadComplete(urls)
      if (success) {
        setSaveComplete(true)
      }
    } catch (err) {
      console.error("Save error:", err)
      alert("Erreur lors de l'enregistrement des pages")
    } finally {
      setSaving(false)
    }
  }

  const allUploaded = images.length > 0 && images.every(img => img.uploadedUrl)
  const hasErrors = images.some(img => img.error)
  const uploadedCount = images.filter(img => img.uploadedUrl).length

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleInputChange}
        disabled={uploading || disabled || images.length >= maxImages}
        className="hidden"
      />

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && images.length < maxImages && fileInputRef.current?.click()}
        className={`
          w-full px-4 py-8 border-2 border-dashed rounded-xl transition-all duration-300 text-center cursor-pointer
          ${dragOver 
            ? "border-fuchsia-500 bg-fuchsia-500/10" 
            : "border-fuchsia-500/30 hover:border-fuchsia-500/60 hover:bg-fuchsia-500/5"
          }
          ${(uploading || images.length >= maxImages) ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <Upload className={`w-10 h-10 mx-auto mb-3 ${dragOver ? "text-fuchsia-400" : "text-fuchsia-500/60"}`} />
        <p className="text-sm font-medium text-foreground">
          {images.length >= maxImages 
            ? `Maximum ${maxImages} pages atteint`
            : "Cliquez ou glissez-déposez vos images"
          }
        </p>
        <p className="text-xs text-foreground/50 mt-1">
          PNG, JPG, WebP, GIF • Max 10MB par image • {images.length}/{maxImages} pages
        </p>
      </div>

      {/* Images preview grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground/80 flex items-center gap-2">
              <Images className="w-4 h-4 text-fuchsia-400" />
              {images.length} page(s) sélectionnée(s)
            </h3>
            <Button
              onClick={clearAll}
              variant="outline"
              size="sm"
              disabled={uploading}
              className="text-xs border-red-500/40 hover:bg-red-500/10 text-red-400"
            >
              <X className="w-3 h-3 mr-1" />
              Tout supprimer
            </Button>
          </div>

          <p className="text-xs text-foreground/50">
            💡 Glissez les images pour réorganiser l'ordre des pages
          </p>

          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 max-h-[400px] overflow-y-auto p-2 bg-fuchsia-500/5 rounded-xl border border-fuchsia-500/10">
            {images.map((image, index) => (
              <div
                key={image.id}
                draggable={!uploading}
                onDragStart={() => handleDragStart(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOverItem(e, index)}
                className={`
                  relative aspect-[3/4] rounded-lg overflow-hidden bg-card/50 border-2 transition-all duration-200 group
                  ${draggedIndex === index ? "opacity-50 scale-95" : ""}
                  ${image.uploadedUrl 
                    ? "border-green-500/50" 
                    : image.error 
                      ? "border-red-500/50" 
                      : "border-fuchsia-500/20"
                  }
                  ${!uploading ? "cursor-grab active:cursor-grabbing" : ""}
                `}
              >
                {/* Page number badge */}
                <div className="absolute top-1 left-1 z-10 w-6 h-6 rounded-full bg-fuchsia-500/90 text-white text-xs font-bold flex items-center justify-center shadow-lg">
                  {index + 1}
                </div>

                {/* Drag handle */}
                {!uploading && (
                  <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-4 h-4 text-white drop-shadow-lg" />
                  </div>
                )}

                {/* Image preview */}
                <img
                  src={image.preview}
                  alt={`Page ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Upload status overlay */}
                {image.uploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-fuchsia-400 animate-spin" />
                  </div>
                )}

                {/* Success indicator */}
                {image.uploadedUrl && !image.uploading && (
                  <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}

                {/* Error indicator */}
                {image.error && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  </div>
                )}

                {/* Remove button */}
                {!uploading && !image.uploadedUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeImage(image.id)
                    }}
                    className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-red-500/90 hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Upload progress */}
          {uploadProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-foreground/80">
                <span>Upload en cours...</span>
                <span>{uploadProgress.current} / {uploadProgress.total}</span>
              </div>
              <div className="w-full bg-card/50 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-fuchsia-500 to-purple-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Error summary */}
          {hasErrors && !uploading && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Certaines images n'ont pas pu être uploadées. Vous pouvez les retirer et réessayer.
            </div>
          )}

          {/* Action buttons */}
          {!saveComplete ? (
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                {images.length < maxImages && !allUploaded && (
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    disabled={uploading || saving}
                    className="flex-1 border-fuchsia-500/40 hover:bg-fuchsia-500/10 text-fuchsia-300"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Ajouter plus d'images
                  </Button>
                )}
                
                <Button
                  onClick={uploadAllImages}
                  disabled={uploading || saving || images.length === 0 || allUploaded}
                  className="flex-1 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-fuchsia-500/25 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Upload en cours...
                    </>
                  ) : allUploaded ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {uploadedCount} page(s) prêtes
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Uploader {images.length} page(s)
                    </>
                  )}
                </Button>
              </div>

              {/* Save to database button - shown when all images uploaded and autoSave is false */}
              {allUploaded && onUploadComplete && !autoSave && (
                <Button
                  onClick={saveToDatabase}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold h-12 gap-2 rounded-xl shadow-lg shadow-green-500/25 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement dans le chapitre...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Enregistrer {uploadedCount} page(s) dans le chapitre
                    </>
                  )}
                </Button>
              )}

              {/* Saving indicator when autoSave is enabled */}
              {saving && autoSave && (
                <div className="flex items-center justify-center gap-2 py-3 text-green-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement automatique dans le chapitre...</span>
                </div>
              )}
            </div>
          ) : (
            /* Success state */
            <div className="text-center py-6 bg-green-500/10 border border-green-500/30 rounded-xl">
              <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground mb-1">
                Pages enregistrées avec succès !
              </h3>
              <p className="text-foreground/60 text-sm">
                {uploadedCount} page(s) ont été ajoutées au chapitre.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
