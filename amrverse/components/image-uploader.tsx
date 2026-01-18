"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Upload, X, Loader2, Check } from "lucide-react"

interface ImageUploaderProps {
  onUpload: (url: string) => void
  disabled?: boolean
  isLoading?: boolean
}

export function ImageUploader({ onUpload, disabled = false, isLoading = false }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate file
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Allowed: JPEG, PNG, WebP, GIF")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Max 10MB allowed")
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("amrverse_token")}`,
        },
        body: formData,
      })

      const result = await response.json()
      if (result.success) {
        setUploadedUrl(result.data.url)
        onUpload(result.data.url)
      } else {
        setError(result.error || "Upload failed")
      }
    } catch (err) {
      setError("Upload failed. Please try again.")
      console.error("[v0] Upload error:", err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleClear = () => {
    setPreview(null)
    setUploadedUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading || disabled}
        className="hidden"
      />

      {!preview && !uploadedUrl ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          className="w-full px-4 py-6 border-2 border-dashed border-primary/30 rounded-lg hover:border-primary/60 transition-colors text-center space-y-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-8 h-8 text-primary/60 mx-auto" />
          <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
          <p className="text-xs text-foreground/50">PNG, JPG, WebP, GIF up to 10MB</p>
        </button>
      ) : (
        <div className="relative rounded-lg overflow-hidden bg-card/50 border border-primary/20">
          <img src={preview || uploadedUrl || ""} alt="Preview" className="w-full h-48 object-cover" />

          {uploadedUrl && (
            <div className="absolute top-2 right-2 bg-primary/90 rounded-full p-2">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}

          {!uploading && (
            <button
              onClick={handleClear}
              className="absolute top-2 left-2 bg-red-500/90 hover:bg-red-600 rounded-full p-2 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      )}

      {error && <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded p-2">{error}</div>}
    </div>
  )
}
