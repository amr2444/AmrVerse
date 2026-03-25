import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getCoverUrl, searchManhwa } from "@/lib/mangadex"

interface LibraryPageProps {
  searchParams?: Promise<{
    q?: string
  }>
}

function LibraryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <Card key={index} className="overflow-hidden py-0">
          <Skeleton className="aspect-[3/4] w-full rounded-none" />
          <CardContent className="space-y-2 p-4">
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function LibraryResults({ query }: { query: string }) {
  const manhwas = await searchManhwa(query, 30, 0)

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Library</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Discover Korean stories</h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Search live MangaDex releases in English and browse a cleaner, production-ready catalog.
          </p>
        </div>
        <div className="hidden rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground md:block">
          {manhwas.length} result{manhwas.length === 1 ? "" : "s"}
        </div>
      </div>

      {manhwas.length === 0 ? (
        <Card className="border-dashed py-0">
          <CardContent className="flex min-h-52 flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-lg font-medium">No manhwa found</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Try another title, author keyword, or shorter search phrase.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {manhwas.map((manhwa) => {
            const coverUrl = manhwa.coverArt
              ? getCoverUrl(manhwa.id, manhwa.coverArt.fileName)
              : "/placeholder.jpg"

            return (
              <Link key={manhwa.id} href={`/manhwa/${manhwa.id}`} className="group block">
                <Card className="h-full overflow-hidden py-0 transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                    <Image
                      src={coverUrl}
                      alt={manhwa.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    />
                  </div>
                  <CardContent className="p-4">
                    <p className="line-clamp-2 text-sm font-semibold leading-5">{manhwa.title}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const query = resolvedSearchParams?.q?.trim() ?? ""

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Card className="border-primary/10 bg-card/80 py-0 shadow-sm backdrop-blur">
          <CardContent className="p-4 sm:p-6">
            <form action="/library" method="get" className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Search titles from MangaDex"
                  className="h-11 pl-10"
                />
              </div>
              <button className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
                Search
              </button>
            </form>
          </CardContent>
        </Card>

        <Suspense key={query} fallback={<LibraryGridSkeleton />}>
          <LibraryResults query={query} />
        </Suspense>
      </div>
    </main>
  )
}
