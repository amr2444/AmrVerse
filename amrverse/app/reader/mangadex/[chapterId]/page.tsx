import Link from "next/link"
import { notFound } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getChapterPages, isUuidLike } from "@/lib/mangadex"

interface MangaDexReaderPageProps {
  params: Promise<{
    chapterId: string
  }>
  searchParams?: Promise<{
    manga?: string
  }>
}

export default async function MangaDexReaderPage({ params, searchParams }: MangaDexReaderPageProps) {
  const { chapterId } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const mangaId = resolvedSearchParams?.manga

  if (!isUuidLike(chapterId)) {
    notFound()
  }

  const result = await getChapterPages(chapterId)

  if (!result.success) {
    const backHref = mangaId ? `/manhwa/${mangaId}` : "/library"

    return (
      <main className="min-h-screen bg-black px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <Card className="border-white/10 bg-zinc-950/90 text-white">
            <CardHeader>
              <CardTitle>This chapter is unavailable</CardTitle>
              <CardDescription className="text-zinc-400">
                The source did not return readable pages for this chapter right now. Try another release or come back later.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link
                href={backHref}
                className="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-black transition hover:bg-white/90"
              >
                Back to chapter list
              </Link>
              <Link
                href="/library"
                className="inline-flex h-10 items-center justify-center rounded-md border border-white/20 px-4 text-sm font-medium text-white transition hover:bg-white/5"
              >
                Browse other titles
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4">
        {result.pages.map((pageUrl, index) => (
          <img
            key={`${chapterId}-${index}`}
            src={pageUrl}
            alt={`Chapter page ${index + 1}`}
            loading={index < 2 ? "eager" : "lazy"}
            className="w-full rounded-sm object-contain"
          />
        ))}
      </div>
    </main>
  )
}
