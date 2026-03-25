import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  getChapterPages,
  groupAndSortChapters,
  getChapters,
  normalizeAndSortChapters,
  parseChapterNumber,
} from "@/lib/mangadex"
import type { MangaDexChapter } from "@/lib/types"

function createChapter(overrides: Partial<MangaDexChapter> = {}): MangaDexChapter {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    type: "chapter",
    volume: null,
    chapter: overrides.chapter ?? null,
    title: overrides.title ?? null,
    translatedLanguage: overrides.translatedLanguage ?? "en",
    publishAt: overrides.publishAt ?? "2026-01-01T00:00:00.000Z",
    pages: overrides.pages ?? 10,
    normalizedChapter: overrides.normalizedChapter ?? null,
    chapterNumber: overrides.chapterNumber ?? null,
    isSpecial: overrides.isSpecial ?? false,
    releaseCount: overrides.releaseCount ?? 1,
  }
}

describe("mangadex helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("parses numeric and special chapter labels", () => {
    expect(parseChapterNumber("10")).toEqual({ normalized: "10", value: 10 })
    expect(parseChapterNumber("10.5")).toEqual({ normalized: "10.5", value: 10.5 })
    expect(parseChapterNumber("special")).toEqual({ normalized: "special", value: null })
    expect(parseChapterNumber(null)).toEqual({ normalized: null, value: null })
  })

  it("normalizes ordering and deduplicates duplicate numeric releases", () => {
    const chapters = normalizeAndSortChapters([
      createChapter({
        id: "late-duplicate",
        chapter: "10",
        chapterNumber: 10,
        normalizedChapter: "10",
        publishAt: "2026-01-03T00:00:00.000Z",
        pages: 0,
      }),
      createChapter({
        id: "preferred-10",
        chapter: "10",
        chapterNumber: 10,
        normalizedChapter: "10",
        publishAt: "2026-01-04T00:00:00.000Z",
        pages: 15,
      }),
      createChapter({
        id: "chapter-9",
        chapter: "9",
        chapterNumber: 9,
        normalizedChapter: "9",
      }),
      createChapter({
        id: "chapter-10-5",
        chapter: "10.5",
        chapterNumber: 10.5,
        normalizedChapter: "10.5",
      }),
      createChapter({
        id: "special-1",
        chapter: null,
        chapterNumber: null,
        normalizedChapter: null,
        isSpecial: true,
        title: "Special Episode",
      }),
    ])

    expect(chapters.map((chapter) => chapter.id)).toEqual([
      "chapter-9",
      "preferred-10",
      "chapter-10-5",
      "special-1",
    ])
    expect(chapters[1]?.releaseCount).toBe(2)
  })

  it("exposes alternate releases separately while keeping one primary chapter", () => {
    const groups = groupAndSortChapters([
      createChapter({
        id: "chapter-12-main",
        chapter: "12",
        chapterNumber: 12,
        normalizedChapter: "12",
        title: "Main release",
        publishAt: "2026-01-04T00:00:00.000Z",
        pages: 12,
      }),
      createChapter({
        id: "chapter-12-alt",
        chapter: "12",
        chapterNumber: 12,
        normalizedChapter: "12",
        title: "Alt release",
        publishAt: "2026-01-02T00:00:00.000Z",
        pages: 8,
      }),
      createChapter({
        id: "special-extra",
        chapter: "extra",
        chapterNumber: null,
        normalizedChapter: "extra",
        isSpecial: true,
        title: "Extra story",
      }),
    ])

    expect(groups).toHaveLength(2)
    expect(groups[0]?.primary.id).toBe("chapter-12-main")
    expect(groups[0]?.alternates.map((chapter) => chapter.id)).toEqual(["chapter-12-alt"])
    expect(groups[1]?.isSpecial).toBe(true)
  })

  it("fetches multiple feed pages when the manga feed exceeds 100 chapters", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            result: "ok",
            response: "collection",
            data: [
              {
                id: "chapter-1",
                type: "chapter",
                attributes: {
                  chapter: "1",
                  translatedLanguage: "en",
                  publishAt: "2026-01-01T00:00:00.000Z",
                  pages: 10,
                },
              },
            ],
            limit: 100,
            offset: 0,
            total: 101,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            result: "ok",
            response: "collection",
            data: [
              {
                id: "chapter-101",
                type: "chapter",
                attributes: {
                  chapter: "101",
                  translatedLanguage: "en",
                  publishAt: "2026-03-01T00:00:00.000Z",
                  pages: 10,
                },
              },
            ],
            limit: 100,
            offset: 100,
            total: 101,
          }),
          { status: 200 },
        ),
      )

    vi.stubGlobal("fetch", fetchMock)

    const chapters = await getChapters("manga-1")

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(chapters.map((chapter) => chapter.chapter)).toEqual(["1", "101"])
  })

  it("falls back to dataSaver pages when full pages are unavailable", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          baseUrl: "https://uploads.mangadex.org",
          chapter: {
            hash: "hash-123",
            data: [],
            dataSaver: ["001.jpg", "002.jpg"],
          },
        }),
        { status: 200 },
      ),
    )

    vi.stubGlobal("fetch", fetchMock)

    const result = await getChapterPages("chapter-1")

    expect(result.success).toBe(true)
    expect(result.source).toBe("dataSaver")
    expect(result.pages[0]).toContain("/data-saver/hash-123/001.jpg")
  })

  it("returns an unavailable result when the source has no readable pages", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          baseUrl: "https://uploads.mangadex.org",
          chapter: {
            hash: "hash-123",
            data: [],
            dataSaver: [],
          },
        }),
        { status: 200 },
      ),
    )

    vi.stubGlobal("fetch", fetchMock)

    const result = await getChapterPages("chapter-2")

    expect(result.success).toBe(false)
    expect(result.reason).toBe("unavailable")
    expect(result.pages).toEqual([])
  })
})
