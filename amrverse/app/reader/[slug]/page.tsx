import { redirect } from "next/navigation"

import { isUuidLike } from "@/lib/mangadex"

interface LegacyReaderPageProps {
  params: Promise<{
    slug: string
  }>
  searchParams?: Promise<{
    chapter?: string
    manga?: string
  }>
}

export function resolveLegacyReaderTarget(
  slug: string,
  options?: {
    chapter?: string
    manga?: string
  },
): string {
  const chapterId = options?.chapter
  const mangaId = options?.manga

  if (chapterId && isUuidLike(chapterId)) {
    return `/reader/local/${chapterId}`
  }

  if (isUuidLike(slug)) {
    const suffix = mangaId ? `?manga=${encodeURIComponent(mangaId)}` : ""
    return `/reader/mangadex/${slug}${suffix}`
  }

  return `/manhwa/${slug}`
}

export default async function LegacyReaderPage({ params, searchParams }: LegacyReaderPageProps) {
  const { slug } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  redirect(resolveLegacyReaderTarget(slug, resolvedSearchParams))
}
