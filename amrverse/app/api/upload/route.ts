// Image upload endpoint using local file system - SECURED
import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join, resolve, basename } from "path"
import crypto from "crypto"
import { getUserIdFromToken } from "@/lib/auth"
import { sanitizeFilename } from "@/lib/validations"
import type { ApiResponse } from "@/lib/types"

interface UploadResponse {
  url: string
  filename: string
  size: number
  uploadedAt: Date
}

// Allowed MIME types and their corresponding extensions
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
}

// Magic bytes for file type validation
const FILE_SIGNATURES: Record<string, number[][]> = {
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/png": [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  "image/gif": [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]] // GIF87a or GIF89a
}

/**
 * Verify file content matches its declared MIME type using magic bytes
 */
function verifyFileSignature(buffer: Buffer, mimeType: string): boolean {
  const signatures = FILE_SIGNATURES[mimeType]
  if (!signatures) return false

  return signatures.some(signature => {
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) return false
    }
    return true
  })
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<UploadResponse>>> {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - No token provided",
        },
        { status: 401 },
      )
    }

    // SECURITY FIX: Use JWT verification instead of base64 decode
    const userId = getUserIdFromToken(token)
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired token",
        },
        { status: 401 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No file provided",
        },
        { status: 400 },
      )
    }

    // Validate declared MIME type
    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF",
        },
        { status: 400 },
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: "File too large. Max 10MB allowed",
        },
        { status: 400 },
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // SECURITY FIX: Verify file content matches declared type (magic bytes check)
    if (!verifyFileSignature(buffer, file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "File content does not match declared type",
        },
        { status: 400 },
      )
    }

    // SECURITY FIX: Generate secure random filename using crypto
    // Don't trust user-provided filename at all
    const timestamp = Date.now()
    const randomBytes = crypto.randomBytes(8).toString("hex")
    const ext = ALLOWED_TYPES[file.type] // Use extension from validated MIME type
    const filename = `${timestamp}-${randomBytes}.${ext}`

    // Create uploads directory if it doesn't exist
    const uploadsDir = resolve(process.cwd(), "public", "uploads")
    await mkdir(uploadsDir, { recursive: true })

    // SECURITY FIX: Ensure file path is within uploads directory
    const filePath = resolve(uploadsDir, filename)
    if (!filePath.startsWith(uploadsDir)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file path",
        },
        { status: 400 },
      )
    }

    await writeFile(filePath, buffer)

    // Return public URL
    const publicUrl = `/uploads/${filename}`

    return NextResponse.json(
      {
        success: true,
        data: {
          url: publicUrl,
          filename: filename,
          size: file.size,
          uploadedAt: new Date(),
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[Upload error]:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload file",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      )
    }

    // SECURITY FIX: Use JWT verification
    const userId = getUserIdFromToken(token)
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired token",
        },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)
    const url = searchParams.get("url")

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: "url parameter is required",
        },
        { status: 400 },
      )
    }

    // SECURITY FIX: Extract and sanitize filename to prevent path traversal
    const rawFilename = url.split('/').pop()
    if (!rawFilename) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid URL",
        },
        { status: 400 },
      )
    }

    // Sanitize filename - removes path separators, .., and invalid characters
    const filename = sanitizeFilename(rawFilename)
    
    // Additional validation: filename should match our generated pattern
    // Pattern: timestamp-randomhex.extension
    const validFilenamePattern = /^\d+-[a-f0-9]+\.(jpg|jpeg|png|webp|gif)$/i
    if (!validFilenamePattern.test(filename)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid filename format",
        },
        { status: 400 },
      )
    }

    // SECURITY FIX: Use resolve and verify path is within uploads directory
    const uploadsDir = resolve(process.cwd(), "public", "uploads")
    const filePath = resolve(uploadsDir, filename)

    // Ensure the resolved path is still within the uploads directory
    if (!filePath.startsWith(uploadsDir + "/") && filePath !== uploadsDir) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied - path traversal attempt detected",
        },
        { status: 403 },
      )
    }

    // Check if file exists before deleting
    const { unlink, access } = await import("fs/promises")
    try {
      await access(filePath)
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "File not found",
        },
        { status: 404 },
      )
    }

    await unlink(filePath)

    return NextResponse.json({
      success: true,
      data: null,
    })
  } catch (error) {
    console.error("[Delete error]:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete file",
      },
      { status: 500 },
    )
  }
}
