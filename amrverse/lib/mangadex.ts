import type {
  MangaDexChapter,
  MangaDexChapterGroup,
  MangaDexChapterPagesResult,
  MangaDexCoverArt,
  MangaDexManga,
  MangaDexPagesResponse,
} from "@/lib/types"

const MANGADEX_API_BASE = "https://api.mangadex.org"
const MANGADEX_UPLOADS_BASE = "https://uploads.mangadex.org"
const FEED_PAGE_SIZE = 100
const FEED_MAX_REQUESTS = 20

interface MangaDexRelationship {
  id: string
  type: string
  attributes?: {
    fileName?: string
    [key: string]: unknown
  }
}

interface MangaDexEntityResponse<T> {
  result: string
  response: string
  data: T
}

interface MangaDexListResponse<T> {
  result: string
  response: string
  data: T[]
  limit: number
  offset: number
  total: number
}

interface MangaDexMangaApiData {
  id: string
  type: "manga"
  attributes: {
    title: Record<string, string>
    altTitles?: Array<Record<string, string>>
    description?: Record<string, string>
    status?: string
    year?: number
    originalLanguage?: string
    lastVolume?: string | null
    lastChapter?: string | null
    contentRating?: string
    publicationDemographic?: string | null
    tags?: Array<{
      id: string
      type: string
      attributes?: {
        name?: Record<string, string>
      }
    }>
  }
  relationships?: MangaDexRelationship[]
}

interface MangaDexChapterApiData {
  id: string
  type: "chapter"
  attributes: {
    volume?: string | null
    chapter?: string | null
    title?: string
    translatedLanguage?: string
    publishAt?: string
    readableAt?: string
    pages?: number
  }
  relationships?: MangaDexRelationship[]
}

interface MangaDexAtHomeResponse {
  baseUrl: string
  chapter: MangaDexPagesResponse
}

interface NormalizedChapterCandidate extends MangaDexChapter {
  sortBucket: number
  sortLabel: string
}

function compareChapterSort(left: MangaDexChapter, right: MangaDexChapter): number {
  const leftBucket = left.chapterNumber === null ? 1 : 0
  const rightBucket = right.chapterNumber === null ? 1 : 0

  if (leftBucket !== rightBucket) {
    return leftBucket - rightBucket
  }

  if (left.chapterNumber !== null && right.chapterNumber !== null && left.chapterNumber !== right.chapterNumber) {
    return left.chapterNumber - right.chapterNumber
  }

  const leftLabel = left.title ?? left.normalizedChapter ?? left.id
  const rightLabel = right.title ?? right.normalizedChapter ?? right.id
  const labelCompare = leftLabel.localeCompare(rightLabel)

  if (labelCompare !== 0) {
    return labelCompare
  }

  return new Date(left.publishAt).getTime() - new Date(right.publishAt).getTime()
}

function buildUrl(path: string, params?: URLSearchParams): string {
  const url = new URL(path, MANGADEX_API_BASE)

  if (params) {
    url.search = params.toString()
  }

  return url.toString()
}

function getLocalizedValue(
  values: Record<string, string> | undefined,
  fallback = "Untitled",
): string {
  if (!values) return fallback

  return values.en ?? values["en-us"] ?? values.ko ?? Object.values(values)[0] ?? fallback
}

function getCoverArt(relationships?: MangaDexRelationship[]): MangaDexCoverArt | undefined {
  const cover = relationships?.find((relationship) => relationship.type === "cover_art")

  if (!cover?.attributes?.fileName) {
    return undefined
  }

  return {
    id: cover.id,
    fileName: cover.attributes.fileName,
  }
}

function mapManga(data: MangaDexMangaApiData): MangaDexManga {
  const coverArt = getCoverArt(data.relationships)

  return {
    id: data.id,
    type: data.type,
    title: getLocalizedValue(data.attributes.title),
    altTitles: data.attributes.altTitles ?? [],
    description: getLocalizedValue(data.attributes.description, "No description available."),
    status: data.attributes.status,
    year: data.attributes.year,
    originalLanguage: data.attributes.originalLanguage,
    lastVolume: data.attributes.lastVolume ?? null,
    lastChapter: data.attributes.lastChapter ?? null,
    contentRating: data.attributes.contentRating,
    publicationDemographic: data.attributes.publicationDemographic ?? null,
    tags:
      data.attributes.tags?.map((tag) => ({
        id: tag.id,
        name: getLocalizedValue(tag.attributes?.name, "Unknown"),
      })) ?? [],
    coverArt,
  }
}

function fetchCacheMode(): RequestCache {
  return process.env.NODE_ENV === "test" ? "default" : "no-store"
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: fetchCacheMode(),
  })

  if (!response.ok) {
    throw new Error(`MangaDex request failed: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as T
}

export function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function parseChapterNumber(chapter: string | null): { normalized: string | null; value: number | null } {
  if (!chapter) {
    return { normalized: null, value: null }
  }

  const cleaned = chapter.trim()

  if (!cleaned) {
    return { normalized: null, value: null }
  }

  if (!/^\d+(?:\.\d+)?$/.test(cleaned)) {
    return { normalized: cleaned.toLowerCase(), value: null }
  }

  const numericValue = Number(cleaned)

  if (!Number.isFinite(numericValue)) {
    return { normalized: cleaned.toLowerCase(), value: null }
  }

  return {
    normalized: numericValue.toString(),
    value: numericValue,
  }
}

function mapChapter(data: MangaDexChapterApiData): NormalizedChapterCandidate {
  const parsedChapter = parseChapterNumber(data.attributes.chapter ?? null)
  const title = data.attributes.title?.trim() || null
  const sortLabel = parsedChapter.normalized ?? title?.toLowerCase() ?? data.id

  return {
    id: data.id,
    type: data.type,
    volume: data.attributes.volume ?? null,
    chapter: data.attributes.chapter ?? null,
    title,
    translatedLanguage: data.attributes.translatedLanguage ?? "en",
    publishAt: data.attributes.publishAt ?? data.attributes.readableAt ?? new Date(0).toISOString(),
    pages: data.attributes.pages ?? 0,
    normalizedChapter: parsedChapter.normalized,
    chapterNumber: parsedChapter.value,
    isSpecial: parsedChapter.value === null,
    releaseCount: 1,
    sortBucket: parsedChapter.value === null ? 1 : 0,
    sortLabel,
  }
}

function comparePreferredRelease(left: MangaDexChapter, right: MangaDexChapter, lang: string): number {
  const leftReadable = left.pages > 0 ? 1 : 0
  const rightReadable = right.pages > 0 ? 1 : 0

  if (leftReadable !== rightReadable) {
    return rightReadable - leftReadable
  }

  const leftLanguageScore = left.translatedLanguage === lang ? 1 : 0
  const rightLanguageScore = right.translatedLanguage === lang ? 1 : 0

  if (leftLanguageScore !== rightLanguageScore) {
    return rightLanguageScore - leftLanguageScore
  }

  const leftNumericScore = left.chapterNumber !== null ? 1 : 0
  const rightNumericScore = right.chapterNumber !== null ? 1 : 0

  if (leftNumericScore !== rightNumericScore) {
    return rightNumericScore - leftNumericScore
  }

  return new Date(right.publishAt).getTime() - new Date(left.publishAt).getTime()
}

export function groupAndSortChapters(
  chapters: MangaDexChapter[],
  lang = "en",
): MangaDexChapterGroup[] {
  const numericGroups = new Map<string, MangaDexChapter[]>()
  const specialEntries: MangaDexChapter[] = []

  for (const chapter of chapters) {
    if (chapter.chapterNumber === null || chapter.normalizedChapter === null) {
      specialEntries.push(chapter)
      continue
    }

    const group = numericGroups.get(chapter.normalizedChapter) ?? []
    group.push(chapter)
    numericGroups.set(chapter.normalizedChapter, group)
  }

  const dedupedNumeric = Array.from(numericGroups.entries()).map(([groupKey, group]) => {
    const sortedGroup = [...group].sort((left, right) => comparePreferredRelease(left, right, lang))
    const [preferred] = sortedGroup

    return {
      key: groupKey,
      label: preferred.chapter ? `Chapter ${preferred.chapter}` : preferred.title ?? "Chapter",
      isSpecial: false,
      primary: {
        ...preferred,
        releaseCount: group.length,
      },
      alternates: sortedGroup.slice(1).map((alternate) => ({
        ...alternate,
        releaseCount: group.length,
      })),
    }
  })

  const dedupedSpecial = specialEntries
    .map((chapter) => ({
      key: chapter.id,
      label: chapter.title ?? chapter.normalizedChapter ?? "Special release",
      isSpecial: true,
      primary: {
        ...chapter,
        releaseCount: 1,
      },
      alternates: [] as MangaDexChapter[],
    }))
    .sort((left, right) => {
      const labelCompare = left.label.localeCompare(right.label)

      if (labelCompare !== 0) {
        return labelCompare
      }

      return new Date(left.primary.publishAt).getTime() - new Date(right.primary.publishAt).getTime()
    })

  dedupedNumeric.sort((left, right) => {
    return compareChapterSort(left.primary, right.primary)
  })

  return [...dedupedNumeric, ...dedupedSpecial]
}

export function normalizeAndSortChapters(chapters: MangaDexChapter[], lang = "en"): MangaDexChapter[] {
  return groupAndSortChapters(chapters, lang).map((group) => group.primary)
}

async function fetchAllChapterFeedPages(mangaId: string, lang: string): Promise<MangaDexChapter[]> {
  const collected: MangaDexChapter[] = []
  let offset = 0
  let total = 0
  let requestCount = 0

  do {
    const params = new URLSearchParams()
    params.append("translatedLanguage[]", lang)
    params.append("order[chapter]", "asc")
    params.append("limit", String(FEED_PAGE_SIZE))
    params.append("offset", String(offset))

    const payload = await fetchJson<MangaDexListResponse<MangaDexChapterApiData>>(
      buildUrl(`/manga/${mangaId}/feed`, params),
    )

    collected.push(...payload.data.map(mapChapter))
    total = payload.total
    offset += payload.limit
    requestCount += 1
  } while (offset < total && requestCount < FEED_MAX_REQUESTS)

  return collected
}

export async function searchManhwa(
  title?: string,
  limit = 24,
  offset = 0,
): Promise<MangaDexManga[]> {
  try {
    const params = new URLSearchParams()
    params.append("limit", String(limit))
    params.append("offset", String(offset))
    params.append("originalLanguage[]", "ko")
    params.append("availableTranslatedLanguage[]", "en")
    params.append("includes[]", "cover_art")
    params.append("order[followedCount]", "desc")

    if (title?.trim()) {
      params.append("title", title.trim())
    }

    const payload = await fetchJson<MangaDexListResponse<MangaDexMangaApiData>>(buildUrl("/manga", params))

    return payload.data.map(mapManga)
  } catch (error) {
    console.error("[MangaDex] searchManhwa failed:", error)
    return []
  }
}

export async function getManhwaById(id: string): Promise<MangaDexManga | null> {
  try {
    const params = new URLSearchParams()
    params.append("includes[]", "cover_art")

    const payload = await fetchJson<MangaDexEntityResponse<MangaDexMangaApiData>>(
      buildUrl(`/manga/${id}`, params),
    )

    return mapManga(payload.data)
  } catch (error) {
    console.error("[MangaDex] getManhwaById failed:", error)
    return null
  }
}

export async function getChapters(mangaId: string, lang = "en"): Promise<MangaDexChapter[]> {
  try {
    const chapters = await fetchAllChapterFeedPages(mangaId, lang)
    return normalizeAndSortChapters(chapters, lang)
  } catch (error) {
    console.error("[MangaDex] getChapters failed:", error)
    return []
  }
}

export async function getChapterGroups(mangaId: string, lang = "en"): Promise<MangaDexChapterGroup[]> {
  try {
    const chapters = await fetchAllChapterFeedPages(mangaId, lang)
    return groupAndSortChapters(chapters, lang)
  } catch (error) {
    console.error("[MangaDex] getChapterGroups failed:", error)
    return []
  }
}

function buildAtHomeUrls(baseUrl: string, hash: string, files: string[], variant: "data" | "dataSaver"): string[] {
  const folder = variant === "data" ? "data" : "data-saver"
  return files.map((fileName) => `${baseUrl}/${folder}/${hash}/${fileName}`)
}

export async function getChapterPages(chapterId: string): Promise<MangaDexChapterPagesResult> {
  try {
    const response = await fetch(buildUrl(`/at-home/server/${chapterId}`), {
      cache: fetchCacheMode(),
    })

    if (!response.ok) {
      console.error("[MangaDex] getChapterPages HTTP failure", {
        chapterId,
        status: response.status,
      })

      return {
        success: false,
        pages: [],
        reason: response.status >= 500 ? "network_error" : "unavailable",
        chapterId,
        source: null,
      }
    }

    const payload = (await response.json()) as MangaDexAtHomeResponse
    const dataPages = Array.isArray(payload.chapter?.data) ? payload.chapter.data : []
    const dataSaverPages = Array.isArray(payload.chapter?.dataSaver) ? payload.chapter.dataSaver : []

    console.info("[MangaDex] chapter page payload", {
      chapterId,
      status: response.status,
      dataCount: dataPages.length,
      dataSaverCount: dataSaverPages.length,
    })

    if (dataPages.length > 0) {
      return {
        success: true,
        pages: buildAtHomeUrls(payload.baseUrl, payload.chapter.hash, dataPages, "data"),
        chapterId,
        source: "data",
      }
    }

    if (dataSaverPages.length > 0) {
      return {
        success: true,
        pages: buildAtHomeUrls(payload.baseUrl, payload.chapter.hash, dataSaverPages, "dataSaver"),
        chapterId,
        source: "dataSaver",
      }
    }

    return {
      success: false,
      pages: [],
      reason: "unavailable",
      chapterId,
      source: null,
    }
  } catch (error) {
    console.error("[MangaDex] getChapterPages failed:", {
      chapterId,
      error,
    })

    return {
      success: false,
      pages: [],
      reason: "network_error",
      chapterId,
      source: null,
    }
  }
}

export function getCoverUrl(mangaId: string, fileName: string): string {
  return `${MANGADEX_UPLOADS_BASE}/covers/${mangaId}/${fileName}.512.jpg`
}
