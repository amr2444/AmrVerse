import { apiGet, apiPatch, apiPost } from "@/lib/api-client"
import type { AdminCreatorRequest, CreatorRequest } from "@/lib/types"

export interface CreatorRequestFormValues {
  fullName: string
  email: string
  presentation: string
  motivation: string
  portfolioUrl?: string
}

export interface AdminCreatorRequestFilters {
  status?: string
  search?: string
  hasPortfolio?: boolean
  resubmitted?: boolean
  sortBy?: "recent" | "oldest"
}

export function getCreatorRequest() {
  return apiGet<CreatorRequest | null>("/api/creator-requests")
}

export function submitCreatorRequest(values: CreatorRequestFormValues) {
  return apiPost<CreatorRequest>("/api/creator-requests", values)
}

export function getAdminCreatorRequests(filters: AdminCreatorRequestFilters = {}) {
  return apiGet<AdminCreatorRequest[]>("/api/admin/creator-requests", {
    status: filters.status || "pending",
    search: filters.search,
    hasPortfolio: filters.hasPortfolio,
    resubmitted: filters.resubmitted,
    sortBy: filters.sortBy || "recent",
  })
}

export function reviewCreatorRequest(requestId: string, action: "approve" | "reject", adminNotes?: string) {
  return apiPatch<{ success: boolean; message: string }>(`/api/admin/creator-requests/${requestId}`, {
    action,
    adminNotes,
  })
}

export function getCreatorRequestStatusLabel(status: CreatorRequest["status"]) {
  switch (status) {
    case "approved":
      return "Approuvée"
    case "rejected":
      return "Rejetée"
    default:
      return "En attente"
  }
}

export function validateCreatorRequest(values: CreatorRequestFormValues) {
  if (!values.fullName || !values.email) {
    return "Veuillez remplir tous les champs obligatoires"
  }

  if (values.presentation.trim().length < 50) {
    return "Votre présentation doit contenir au moins 50 caractères"
  }

  if (values.motivation.trim().length < 50) {
    return "Votre motivation doit contenir au moins 50 caractères"
  }

  return null
}
