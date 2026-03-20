export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { clearAuthCookies } from "@/lib/auth-cookies"
import type { ApiResponse } from "@/lib/types"

export async function POST() {
  const response = NextResponse.json<ApiResponse<null>>({
    success: true,
    data: null,
    message: "Logged out",
  })

  clearAuthCookies(response)
  return response
}
