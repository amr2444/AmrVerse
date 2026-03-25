import { apiDelete, apiPostForm } from "@/lib/api-client"

export interface UploadAsset {
  url: string
  filename: string
  pathname: string
  size: number
  uploadedAt: string | Date
}

export async function uploadAsset(file: File) {
  const formData = new FormData()
  formData.append("file", file)
  return apiPostForm<UploadAsset>("/api/upload", formData)
}

export function deleteAsset(url: string) {
  return apiDelete<null>("/api/upload", { url })
}
