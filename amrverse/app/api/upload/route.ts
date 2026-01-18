// Image upload endpoint using local file system
import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import type { ApiResponse } from "@/lib/types"

interface UploadResponse {
  url: string
  filename: string
  size: number
  uploadedAt: Date
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

    // Verify token by decoding userId
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8")
      const [userId] = decoded.split(":")
      if (!userId) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid token",
          },
          { status: 401 },
        )
      }
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid token format",
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

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
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

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const ext = file.name.split('.').pop()
    const filename = `${timestamp}-${random}.${ext}`

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads")
    await mkdir(uploadsDir, { recursive: true })

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(uploadsDir, filename)
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

    // Extract filename from URL (e.g., /uploads/filename.jpg)
    const filename = url.split('/').pop()
    if (!filename) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid URL",
        },
        { status: 400 },
      )
    }

    // Delete file from local storage
    const { unlink } = await import("fs/promises")
    const filePath = join(process.cwd(), "public", "uploads", filename)
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
