// Image upload endpoint using object storage - SECURED
import { type NextRequest, NextResponse } from "next/server"
import { del, put } from "@vercel/blob"
import crypto from "crypto"
import { getAuthenticatedUserId } from "@/lib/auth-request"
import { applyRateLimit, createRateLimitHeaders, getRateLimitIdentifier } from "@/lib/rate-limiter"
import { captureException, logEvent, withRateLimitHeaders } from "@/lib/observability"
import { sanitizeFilename } from "@/lib/validations"
import type { ApiResponse } from "@/lib/types"

interface UploadResponse {
  url: string
  filename: string
  pathname: string
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
    const userId = getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - No token provided",
        },
        { status: 401 },
      )
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    if (!blobToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Object storage is not configured",
        },
        { status: 500 },
      )
    }

    const { result: rateLimitResult, response: rateLimitResponse } = applyRateLimit(
      request,
      "upload",
      getRateLimitIdentifier(request, userId),
    )
    if (rateLimitResponse) {
      logEvent({ level: "warn", event: "upload.rate_limited", request, userId })
      return rateLimitResponse as NextResponse<ApiResponse<UploadResponse>>
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

    const blob = await put(`uploads/${userId}/${filename}`, buffer, {
      access: "public",
      addRandomSuffix: false,
      token: blobToken,
      contentType: file.type,
    })

    const response = NextResponse.json(
      {
        success: true,
        data: {
          url: blob.url,
          filename,
          pathname: blob.pathname,
          size: file.size,
          uploadedAt: new Date(),
        },
      },
      { status: 201 },
    )
    logEvent({ event: "upload.completed", request, userId, metadata: { filename, size: file.size, contentType: file.type } })
    return withRateLimitHeaders(response, createRateLimitHeaders(rateLimitResult))
  } catch (error) {
    await captureException({ event: "upload.failed", request, error })
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
    const userId = getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      )
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    if (!blobToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Object storage is not configured",
        },
        { status: 500 },
      )
    }

    const { result: rateLimitResult, response: rateLimitResponse } = applyRateLimit(
      request,
      "upload",
      getRateLimitIdentifier(request, userId),
    )
    if (rateLimitResponse) {
      logEvent({ level: "warn", event: "upload.delete_rate_limited", request, userId })
      return rateLimitResponse as NextResponse<ApiResponse<null>>
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

    const parsedUrl = new URL(url)
    if (!parsedUrl.pathname.startsWith(`/uploads/${userId}/`)) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied",
        },
        { status: 403 },
      )
    }

    await del(url, { token: blobToken })

    const response = NextResponse.json({
      success: true,
      data: null,
    })
    logEvent({ event: "upload.deleted", request, userId, metadata: { url } })
    return withRateLimitHeaders(response, createRateLimitHeaders(rateLimitResult))
  } catch (error) {
    await captureException({ event: "upload.delete_failed", request, error })
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete file",
      },
      { status: 500 },
    )
  }
}
