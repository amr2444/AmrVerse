import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import sql from "@/lib/db"
import { getChapterGroups, getCoverUrl, getManhwaById, isUuidLike } from "@/lib/mangadex"
import type { Chapter, Manhwa, MangaDexChapter, MangaDexChapterGroup, MangaDexManga } from "@/lib/types"

interface LocalManhwaRow {
  id: string
  title: string
  slug: string
  description: string | null
  cover_url: string | null
  author: string | null
  status: string
  genre: string[] | null
  rating: number
  total_chapters: number
  created_by: string
  created_at: Date
  updated_at: Date
}

interface LocalChapterRow {
  id: string
  manhwa_id: string
  chapter_number: number
  title: string | null
  description: string | null
  pages_count: number
  published_at: Date
  created_at: Date
  updated_at: Date
}

interface ManhwaDetailPageProps {
  params: Promise<{
    id: string
  }>
}

function formatChapterLabel(chapter: string | null): string {
  return chapter ? `Chapter ${chapter}` : "Chapter"
}

function formatLocalChapterLabel(chapterNumber: number): string {
  return `Chapter ${chapterNumber}`
}

async function getLocalManhwaById(id: string): Promise<Manhwa | null> {
  const [row] = await sql<LocalManhwaRow>(
    `SELECT id, title, slug, description, cover_url, author, status, genre, rating, total_chapters, created_by, created_at, updated_at
     FROM manhwas
     WHERE slug = $1 OR id::text = $1`,
    [id],
  )

  if (!row) {
    return null
  }

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? undefined,
    coverUrl: row.cover_url ?? undefined,
    author: row.author ?? undefined,
    status: row.status as Manhwa["status"],
    genres: row.genre ?? [],
    rating: row.rating,
    totalChapters: row.total_chapters,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function getLocalChapters(manhwaId: string): Promise<Chapter[]> {
  const rows = await sql<LocalChapterRow>(
    `SELECT id, manhwa_id, chapter_number, title, description, pages_count, published_at, created_at, updated_at
     FROM chapters
     WHERE manhwa_id = $1
     ORDER BY chapter_number ASC`,
    [manhwaId],
  )

  return rows.map((row) => ({
    id: row.id,
    manhwaId: row.manhwa_id,
    chapterNumber: row.chapter_number,
    title: row.title ?? undefined,
    description: row.description ?? undefined,
    pagesCount: row.pages_count,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

function ChapterReleaseLink({
  chapter,
  mangaId,
  compact = false,
}: {
  chapter: MangaDexChapter
  mangaId: string
  compact?: boolean
}) {
  return (
    <Link
      href={`/reader/mangadex/${chapter.id}?manga=${mangaId}`}
      className={
        compact
          ? "block rounded-md border bg-background/70 px-3 py-3 transition-colors hover:bg-muted/40"
          : "block rounded-lg border bg-background px-4 py-4 transition-colors hover:bg-muted/40"
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{formatChapterLabel(chapter.chapter)}</p>
            {chapter.releaseCount > 1 && !compact ? <Badge variant="outline">{chapter.releaseCount} releases</Badge> : null}
            {chapter.isSpecial ? <Badge variant="secondary">Special</Badge> : null}
            {compact ? <Badge variant="outline">Alternate</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">{chapter.title?.trim() || "Untitled release"}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(chapter.publishAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
    </Link>
  )
}

function MangaDexDetail({ manhwa, chapterGroups }: { manhwa: MangaDexManga; chapterGroups: MangaDexChapterGroup[] }) {
  const coverUrl = manhwa.coverArt ? getCoverUrl(manhwa.id, manhwa.coverArt.fileName) : "/placeholder.jpg"

  return (
    <>
      <Card className="overflow-hidden py-0">
        <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
          <div className="relative min-h-[420px] bg-muted">
            <Image
              src={coverUrl}
              alt={manhwa.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 320px"
            />
          </div>

          <div className="flex flex-col justify-between">
            <CardHeader className="gap-4 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>MangaDex</Badge>
                <Badge variant="outline">{manhwa.originalLanguage?.toUpperCase() ?? "KO"}</Badge>
                {manhwa.status ? <Badge variant="secondary">{manhwa.status}</Badge> : null}
                {manhwa.year ? <Badge variant="outline">{manhwa.year}</Badge> : null}
              </div>
              <div className="space-y-3">
                <CardTitle className="text-3xl leading-tight sm:text-4xl">{manhwa.title}</CardTitle>
                <CardDescription className="max-w-3xl text-sm leading-6 sm:text-base">
                  {manhwa.description}
                </CardDescription>
              </div>
              {manhwa.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {manhwa.tags.slice(0, 8).map((tag) => (
                    <Badge key={tag.id} variant="outline">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardHeader>
          </div>
        </div>
      </Card>

      <Card>
          <CardHeader>
            <CardTitle>Chapters</CardTitle>
            <CardDescription>
            {chapterGroups.length > 0
              ? "Primary releases are cleaned and ordered, with alternate scan-group releases available on demand."
              : "No English chapters are available for this title yet."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {chapterGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Check back later for available releases.</p>
          ) : (
            chapterGroups.map((group, index) => (
              <div key={group.key} className="space-y-4">
                <ChapterReleaseLink chapter={group.primary} mangaId={manhwa.id} />
                {group.alternates.length > 0 ? (
                  <details className="rounded-lg border border-dashed bg-muted/20 p-4">
                    <summary className="cursor-pointer list-none text-sm font-medium text-foreground marker:hidden">
                      View {group.alternates.length} alternate release{group.alternates.length === 1 ? "" : "s"}
                    </summary>
                    <div className="mt-4 space-y-3">
                      {group.alternates.map((alternate) => (
                        <ChapterReleaseLink key={alternate.id} chapter={alternate} mangaId={manhwa.id} compact />
                      ))}
                    </div>
                  </details>
                ) : null}
                {index < chapterGroups.length - 1 ? <Separator /> : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  )
}

function LocalDetail({ manhwa, chapters }: { manhwa: Manhwa; chapters: Chapter[] }) {
  const coverUrl = manhwa.coverUrl ?? "/placeholder.jpg"

  return (
    <>
      <Card className="overflow-hidden py-0">
        <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
          <div className="relative min-h-[420px] bg-muted">
            <Image
              src={coverUrl}
              alt={manhwa.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 320px"
            />
          </div>

          <div className="flex flex-col justify-between">
            <CardHeader className="gap-4 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Local Library</Badge>
                <Badge variant="secondary">{manhwa.status}</Badge>
                {manhwa.author ? <Badge variant="outline">{manhwa.author}</Badge> : null}
              </div>
              <div className="space-y-3">
                <CardTitle className="text-3xl leading-tight sm:text-4xl">{manhwa.title}</CardTitle>
                <CardDescription className="max-w-3xl text-sm leading-6 sm:text-base">
                  {manhwa.description || "No description available."}
                </CardDescription>
              </div>
              {manhwa.genres.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {manhwa.genres.map((genre) => (
                    <Badge key={genre} variant="outline">
                      {genre}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardHeader>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chapters</CardTitle>
          <CardDescription>
            {chapters.length > 0 ? "Your uploaded chapters are available below." : "No local chapters are available yet."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {chapters.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add pages from the creator studio to start reading.</p>
          ) : (
            chapters.map((chapter, index) => (
              <div key={chapter.id} className="space-y-4">
                <Link
                  href={`/reader/local/${chapter.id}`}
                  className="block rounded-lg border bg-background px-4 py-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{formatLocalChapterLabel(chapter.chapterNumber)}</p>
                      <p className="text-sm text-muted-foreground">{chapter.title?.trim() || "Untitled chapter"}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(chapter.publishedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </Link>
                {index < chapters.length - 1 ? <Separator /> : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  )
}

export default async function ManhwaDetailPage({ params }: ManhwaDetailPageProps) {
  const { id } = await params

  let mangaDexManhwa: MangaDexManga | null = null

  if (isUuidLike(id)) {
    mangaDexManhwa = await getManhwaById(id)
  }

  if (mangaDexManhwa) {
    const chapterGroups = await getChapterGroups(mangaDexManhwa.id)

    return (
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <MangaDexDetail manhwa={mangaDexManhwa} chapterGroups={chapterGroups} />
        </div>
      </main>
    )
  }

  const localManhwa = await getLocalManhwaById(id)

  if (!localManhwa) {
    notFound()
  }

  const localChapters = await getLocalChapters(localManhwa.id)

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <LocalDetail manhwa={localManhwa} chapters={localChapters} />
      </div>
    </main>
  )
}
