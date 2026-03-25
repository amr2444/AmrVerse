import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client"
import type { Chapter, Manhwa, PaginatedResponse } from "@/lib/types"

export interface CreateManhwaInput {
  title: string
  author: string
  description: string
  coverUrl: string
  genres: string[]
}

export function listManhwas(pageSize = 100) {
  return apiGet<PaginatedResponse<Manhwa>>("/api/manhwas", { page: 1, pageSize })
}

export function listManhwaChapters(manhwaId: string) {
  return apiGet<Chapter[]>(`/api/manhwas/${manhwaId}/chapters`)
}

export function updateChapter(chapterId: string, payload: { title?: string }) {
  return apiPatch<Chapter>(`/api/chapters/${chapterId}`, payload)
}

export function deleteChapter(chapterId: string) {
  return apiDelete<{ deleted: boolean }>(`/api/chapters/${chapterId}`)
}

export function createManhwa(input: CreateManhwaInput) {
  const slug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return apiPost<Manhwa>("/api/manhwas", {
    title: input.title,
    slug,
    description: input.description,
    coverUrl: input.coverUrl,
    author: input.author,
    genre: input.genres,
    status: "ongoing",
  })
}
