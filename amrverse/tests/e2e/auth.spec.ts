import { expect, test } from "@playwright/test"

test("user can sign up from the auth page", async ({ page }) => {
  test.setTimeout(60_000)
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ success: false }) })
  })

  await page.route("**/api/auth/signup", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            id: "user-1",
            email: "reader@example.com",
            username: "reader1",
            displayName: "Reader One",
            avatarUrl: null,
            bio: null,
            isCreator: false,
            isAdmin: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          accessToken: "access-token",
          refreshToken: "refresh-token",
        },
      }),
    })
  })

  await page.route("**/api/dashboard", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          readingHistory: [],
          favorites: [],
          activeRooms: [],
          stats: { totalChaptersRead: 0, totalFavorites: 0, activeRoomsCount: 0 },
        },
      }),
    })
  })

  await page.goto("/auth")
  await page.getByRole("button", { name: "Sign Up" }).click()
  await expect(page.getByRole("heading", { name: "Join the Manhwa Universe" })).toBeVisible()
  await page.getByLabel("Email").fill("reader@example.com")
  await page.getByLabel("Username").fill("reader1")
  await page.getByLabel("Display Name (optional)").fill("Reader One")
  await page.getByLabel("Password").fill("GoodPassword123!")
  await Promise.all([
    page.waitForResponse("**/api/auth/signup"),
    page.locator("form").getByRole("button", { name: "Create Account" }).click(),
  ])

  await page.waitForURL("**/dashboard")
  await expect(page).toHaveURL(/\/dashboard$/)
})

test("user can log in from the auth page", async ({ page }) => {
  test.setTimeout(60_000)
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ success: false }) })
  })

  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            id: "user-1",
            email: "reader@example.com",
            username: "reader1",
            displayName: "Reader One",
            avatarUrl: null,
            bio: null,
            isCreator: false,
            isAdmin: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          accessToken: "access-token",
          refreshToken: "refresh-token",
        },
      }),
    })
  })

  await page.route("**/api/dashboard", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          readingHistory: [],
          favorites: [],
          activeRooms: [],
          stats: { totalChaptersRead: 1, totalFavorites: 2, activeRoomsCount: 0 },
        },
      }),
    })
  })

  await page.goto("/auth")
  await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible()
  await page.getByLabel("Email").fill("reader@example.com")
  await page.getByLabel("Password").fill("GoodPassword123!")
  await Promise.all([
    page.waitForResponse("**/api/auth/login"),
    page.locator("form").getByRole("button", { name: "Sign In" }).click(),
  ])

  await page.waitForURL("**/dashboard")
  await expect(page).toHaveURL(/\/dashboard$/)
})
