import { describe, expect, it } from "vitest"

import { resolveLegacyReaderTarget } from "@/app/reader/[slug]/page"

describe("legacy reader route resolution", () => {
  it("redirects local history links to the local reader", () => {
    expect(
      resolveLegacyReaderTarget("legacy-slug", {
        chapter: "123e4567-e89b-12d3-a456-426614174000",
      }),
    ).toBe("/reader/local/123e4567-e89b-12d3-a456-426614174000")
  })

  it("redirects uuid chapter slugs to the MangaDex reader", () => {
    expect(
      resolveLegacyReaderTarget("123e4567-e89b-12d3-a456-426614174000", {
        manga: "abcd-efgh",
      }),
    ).toBe("/reader/mangadex/123e4567-e89b-12d3-a456-426614174000?manga=abcd-efgh")
  })

  it("redirects non-uuid slugs back to the manhwa detail page", () => {
    expect(resolveLegacyReaderTarget("solo-leveling")).toBe("/manhwa/solo-leveling")
  })
})
