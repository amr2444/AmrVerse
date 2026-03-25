import type { NextRequest, NextResponse } from "next/server"

type LogLevel = "info" | "warn" | "error"

interface LogEventOptions {
  level?: LogLevel
  event: string
  request?: Request | NextRequest
  userId?: string | null
  metadata?: Record<string, unknown>
  error?: unknown
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return {
    message: typeof error === "string" ? error : "Unknown error",
  }
}

function extractRequestContext(request?: Request | NextRequest) {
  if (!request) {
    return undefined
  }

  const url = new URL(request.url)

  return {
    method: request.method,
    path: url.pathname,
    search: url.search || undefined,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || undefined,
    userAgent: request.headers.get("user-agent") || undefined,
  }
}

export function logEvent(options: LogEventOptions) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: options.level || "info",
    event: options.event,
    userId: options.userId || undefined,
    request: extractRequestContext(options.request),
    metadata: options.metadata,
    error: options.error ? serializeError(options.error) : undefined,
  }

  const payload = JSON.stringify(entry)

  if ((options.level || "info") === "error") {
    console.error(payload)
    return
  }

  if ((options.level || "info") === "warn") {
    console.warn(payload)
    return
  }

  console.log(payload)
}

export async function captureException(options: LogEventOptions) {
  logEvent({ ...options, level: options.level || "error" })

  const webhookUrl = process.env.MONITORING_WEBHOOK_URL
  if (!webhookUrl) {
    return
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "amrverse",
        environment: process.env.NODE_ENV,
        event: options.event,
        userId: options.userId || undefined,
        request: extractRequestContext(options.request),
        metadata: options.metadata,
        error: options.error ? serializeError(options.error) : undefined,
        timestamp: new Date().toISOString(),
      }),
      cache: "no-store",
    })
  } catch (webhookError) {
    logEvent({
      level: "warn",
      event: "monitoring.webhook_failed",
      metadata: { originalEvent: options.event },
      error: webhookError,
    })
  }
}

export function withRateLimitHeaders<T>(response: NextResponse<T>, headers: Record<string, string>) {
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }

  return response
}
