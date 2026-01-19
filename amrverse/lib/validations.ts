// Input validation schemas
// Senior-level validation for API requests

export interface SignupPayload {
  email: string
  username: string
  password: string
  displayName?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface CreateRoomPayload {
  manhwaId: string
  chapterId: string
  roomName?: string
  maxParticipants?: number
}

export interface SendMessagePayload {
  roomId: string
  message: string
}

export interface AddPanelCommentPayload {
  chapterPageId: string
  roomId: string
  comment: string
  xPosition?: number
  yPosition?: number
}

// Validation functions
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateUsername(username: string): boolean {
  // 3-20 characters, alphanumeric and underscore only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

export function validatePassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  return passwordRegex.test(password)
}

export function validateSignup(payload: SignupPayload): string[] {
  const errors: string[] = []

  if (!validateEmail(payload.email)) {
    errors.push("Invalid email format")
  }

  if (!validateUsername(payload.username)) {
    errors.push("Username must be 3-20 characters, alphanumeric and underscore only")
  }

  if (!validatePassword(payload.password)) {
    errors.push("Password must be at least 8 characters with uppercase, lowercase, and numbers")
  }

  if (payload.displayName && payload.displayName.length > 255) {
    errors.push("Display name must be less than 255 characters")
  }

  return errors
}

// ============================================================================
// XSS SANITIZATION
// ============================================================================

/**
 * HTML entities map for escaping dangerous characters
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
}

/**
 * Sanitize user input to prevent XSS attacks
 * Escapes HTML special characters and removes potentially dangerous patterns
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // First, escape HTML special characters
  let sanitized = input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char)

  // Remove any null bytes
  sanitized = sanitized.replace(/\0/g, '')

  // Remove javascript: and data: URLs
  sanitized = sanitized.replace(/javascript:/gi, '')
  sanitized = sanitized.replace(/data:/gi, '')
  sanitized = sanitized.replace(/vbscript:/gi, '')

  // Remove on* event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=/gi, '')

  return sanitized.trim()
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 * Only allows alphanumeric characters, hyphens, underscores, and dots
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return ''
  }

  // Remove path separators and parent directory references
  let sanitized = filename.replace(/[/\\]/g, '')
  sanitized = sanitized.replace(/\.\./g, '')

  // Only allow safe characters: alphanumeric, hyphen, underscore, dot
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '')

  // Remove leading dots (hidden files)
  sanitized = sanitized.replace(/^\.+/, '')

  // Ensure the filename is not empty after sanitization
  if (!sanitized) {
    return 'unnamed_file'
  }

  return sanitized
}

/**
 * Validate that a string contains only allowed characters for display names/bios
 */
export function validateDisplayText(text: string, maxLength: number = 500): boolean {
  if (!text) return true
  if (text.length > maxLength) return false
  
  // Check for null bytes or control characters (except newlines and tabs)
  const hasInvalidChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(text)
  return !hasInvalidChars
}
