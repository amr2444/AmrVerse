"use client"

interface ClientErrorPayload {
  event: string
  message: string
  stack?: string
  metadata?: Record<string, unknown>
}

export async function reportClientError(payload: ClientErrorPayload) {
  try {
    await fetch("/api/monitoring/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    })
  } catch {
    // Avoid recursive client-side logging loops.
  }
}
