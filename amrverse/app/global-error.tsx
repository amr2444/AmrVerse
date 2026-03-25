"use client"

import { useEffect } from "react"
import { reportClientError } from "@/lib/client-monitoring"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void reportClientError({
      event: "client.global_error_boundary",
      message: error.message,
      stack: error.stack,
      metadata: {
        digest: error.digest,
      },
    })
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-lg text-center space-y-4">
          <p className="text-sm uppercase tracking-[0.25em] text-foreground/60">Monitoring Active</p>
          <h1 className="text-3xl font-semibold">Something broke unexpectedly.</h1>
          <p className="text-foreground/70">
            The error has been reported. You can retry now, and if it keeps failing we know exactly where to look.
          </p>
          <button
            onClick={() => reset()}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 font-medium text-primary-foreground"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
