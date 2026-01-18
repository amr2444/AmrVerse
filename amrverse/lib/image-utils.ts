// Image handling utilities
export function getImageUrl(url: string | null): string {
  if (!url) {
    return "/placeholder.svg?height=400&width=300"
  }
  return url
}

export function getOptimizedImageUrl(url: string, width: number, height: number): string {
  if (!url || !url.includes("blob.vercel-storage.com")) {
    return url
  }

  // Vercel Blob supports basic parameters
  return `${url}?width=${width}&height=${height}`
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF",
    }
  }

  if (file.size > 10 * 1024 * 1024) {
    return {
      valid: false,
      error: "File too large. Max 10MB allowed",
    }
  }

  return { valid: true }
}
