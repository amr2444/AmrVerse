export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { applyRateLimit, createRateLimitHeaders, getClientIP } from "@/lib/rate-limiter"
import { captureException, logEvent, withRateLimitHeaders } from "@/lib/observability"
import type { ApiResponse } from "@/lib/types"

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<null>>> {
  const { result, response } = applyRateLimit(request, "monitoring", getClientIP(request))
  if (response) {
    return response as NextResponse<ApiResponse<null>>
  }

  try {
    const payload = await request.json()

    await captureException({
      event: payload.event || "client.unknown_error",
      request,
      metadata: {
        message: payload.message,
        stack: payload.stack,
        clientMetadata: payload.metadata,
      },
    })

    const apiResponse = NextResponse.json<ApiResponse<null>>({ success: true, data: null }, { status: 202 })
    return withRateLimitHeaders(apiResponse, createRateLimitHeaders(result))
  } catch (error) {
    await captureException({
      event: "monitoring.ingest_failed",
      request,
      error,
    })

    const apiResponse = NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to ingest monitoring event" },
      { status: 500 },
    )
    return withRateLimitHeaders(apiResponse, createRateLimitHeaders(result))
  }
}
