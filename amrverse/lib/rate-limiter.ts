// Rate Limiter - Protects against brute force and abuse
// Uses in-memory storage (for production, consider Redis)

interface RateLimitEntry {
  count: number
  firstRequest: number
  blockedUntil?: number
}

interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Max requests per window
  blockDurationMs: number // How long to block after exceeding limit
}

// Default configurations for different endpoint types
export const RATE_LIMIT_CONFIGS = {
  // Auth endpoints - strict limits to prevent brute force
  auth: {
    windowMs: 15 * 60 * 1000,     // 15 minutes
    maxRequests: 5,               // 5 attempts
    blockDurationMs: 30 * 60 * 1000 // 30 minutes block
  },
  // API endpoints - moderate limits
  api: {
    windowMs: 60 * 1000,          // 1 minute
    maxRequests: 60,              // 60 requests per minute
    blockDurationMs: 5 * 60 * 1000 // 5 minutes block
  },
  // Chat/messages - higher limits for real-time features
  chat: {
    windowMs: 60 * 1000,          // 1 minute
    maxRequests: 30,              // 30 messages per minute
    blockDurationMs: 2 * 60 * 1000 // 2 minutes block
  },
  // Upload - strict limits
  upload: {
    windowMs: 60 * 60 * 1000,     // 1 hour
    maxRequests: 50,              // 50 uploads per hour
    blockDurationMs: 60 * 60 * 1000 // 1 hour block
  }
} as const

// In-memory store - Maps IP/userId to their rate limit entries
// Key format: "type:identifier" (e.g., "auth:192.168.1.1" or "api:user123")
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 10 minutes
const CLEANUP_INTERVAL = 10 * 60 * 1000
let cleanupTimer: NodeJS.Timeout | null = null

function startCleanup() {
  if (cleanupTimer) return
  
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      // Remove entries that are past their window and not blocked
      const isExpired = now - entry.firstRequest > 60 * 60 * 1000 // 1 hour max retention
      const isUnblocked = !entry.blockedUntil || now > entry.blockedUntil
      
      if (isExpired && isUnblocked) {
        rateLimitStore.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)
}

// Start cleanup on module load
startCleanup()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number // Seconds until retry allowed (if blocked)
}

/**
 * Check if a request should be rate limited
 * @param identifier - IP address or user ID
 * @param type - Type of rate limit config to use
 * @returns RateLimitResult with allowed status and metadata
 */
export function checkRateLimit(
  identifier: string,
  type: keyof typeof RATE_LIMIT_CONFIGS
): RateLimitResult {
  const config = RATE_LIMIT_CONFIGS[type]
  const key = `${type}:${identifier}`
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  // Check if currently blocked
  if (entry?.blockedUntil && now < entry.blockedUntil) {
    const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.blockedUntil,
      retryAfter
    }
  }

  // Check if window has expired, reset if so
  if (!entry || now - entry.firstRequest > config.windowMs) {
    entry = {
      count: 1,
      firstRequest: now
    }
    rateLimitStore.set(key, entry)
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    }
  }

  // Increment count
  entry.count++

  // Check if over limit
  if (entry.count > config.maxRequests) {
    entry.blockedUntil = now + config.blockDurationMs
    rateLimitStore.set(key, entry)
    
    const retryAfter = Math.ceil(config.blockDurationMs / 1000)
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.blockedUntil,
      retryAfter
    }
  }

  rateLimitStore.set(key, entry)
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.firstRequest + config.windowMs
  }
}

/**
 * Get client IP from request headers
 * Handles proxies and load balancers
 */
export function getClientIP(request: Request): string {
  // Check various headers for client IP (in order of reliability)
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    // Take the first IP (original client)
    return forwardedFor.split(",")[0].trim()
  }

  const realIP = request.headers.get("x-real-ip")
  if (realIP) {
    return realIP.trim()
  }

  // Fallback - in development this might be "::1" or "127.0.0.1"
  return "unknown"
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetTime.toString()
  }

  if (result.retryAfter) {
    headers["Retry-After"] = result.retryAfter.toString()
  }

  return headers
}

/**
 * Reset rate limit for a specific identifier (useful for successful auth)
 */
export function resetRateLimit(identifier: string, type: keyof typeof RATE_LIMIT_CONFIGS): void {
  const key = `${type}:${identifier}`
  rateLimitStore.delete(key)
}

/**
 * Helper to apply rate limiting to API routes
 * Returns null if allowed, or a Response if blocked
 */
export function applyRateLimit(
  request: Request,
  type: keyof typeof RATE_LIMIT_CONFIGS,
  customIdentifier?: string
): { result: RateLimitResult; response: Response | null } {
  const identifier = customIdentifier || getClientIP(request)
  const result = checkRateLimit(identifier, type)
  
  if (!result.allowed) {
    const headers = createRateLimitHeaders(result)
    return {
      result,
      response: new Response(
        JSON.stringify({
          success: false,
          error: "Too many requests. Please try again later.",
          retryAfter: result.retryAfter
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...headers
          }
        }
      )
    }
  }

  return { result, response: null }
}
