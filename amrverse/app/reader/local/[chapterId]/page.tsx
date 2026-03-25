import { notFound } from "next/navigation"

import sql from "@/lib/db"
import { isUuidLike } from "@/lib/mangadex"

interface LocalChapterPageRow {
  id: string
  page_number: number
  image_url: string
}

interface LocalReaderPageProps {
  params: Promise<{
    chapterId: string
  }>
}

export default async function LocalReaderPage({ params }: LocalReaderPageProps) {
  const { chapterId } = await params

  if (!isUuidLike(chapterId)) {
    notFound()
  }

  const pages = await sql<LocalChapterPageRow>(
    `SELECT id, page_number, image_url
     FROM chapter_pages
     WHERE chapter_id = $1
     ORDER BY page_number ASC`,
    [chapterId],
  )

  if (pages.length === 0) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4">
        {pages.map((page, index) => (
          <img
            key={page.id}
            src={page.image_url}
            alt={`Chapter page ${index + 1}`}
            loading={index < 2 ? "eager" : "lazy"}
            className="w-full rounded-sm object-contain"
          />
        ))}
      </div>
    </main>
  )
}
