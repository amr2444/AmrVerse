"use client"

import { useEffect } from "react"
import { reportClientError } from "@/lib/client-monitoring"

export function ProductionMonitor() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      void reportClientError({
        event: "client.window_error",
        message: event.message || "Unhandled browser error",
        stack: event.error?.stack,
        metadata: {
          fileName: event.filename,
          line: event.lineno,
          column: event.colno,
        },
      })
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      void reportClientError({
        event: "client.unhandled_rejection",
        message: reason.message,
        stack: reason.stack,
      })
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onUnhandledRejection)

    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onUnhandledRejection)
    }
  }, [])

  return null
}
