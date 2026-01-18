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
