import { expect, test } from "@playwright/test"

test("authenticated user can view creator request status", async ({ page }) => {
  await page.route("**/api/auth/session", async (route) => {
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
        },
      }),
    })
  })

  await page.route("**/api/creator-requests", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          id: "req-1",
          userId: "user-1",
          fullName: "Reader One",
          email: "reader@example.com",
          presentation: "a".repeat(60),
          motivation: "b".repeat(60),
          status: "pending",
          createdAt: new Date().toISOString(),
        },
      }),
    })
  })

  await page.goto("/become-creator")
  await expect(page.getByText("Demande en cours de traitement")).toBeVisible()
  await expect(page.getByText(/Vous recevrez une reponse par email/i)).toBeVisible()
})

test("creator can create a new manhwa from creator studio", async ({ page }) => {
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            id: "creator-1",
            email: "creator@example.com",
            username: "creator1",
            displayName: "Creator One",
            avatarUrl: null,
            bio: null,
            isCreator: true,
            isAdmin: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      }),
    })
  })

  await page.route("**/api/manhwas?page=1&pageSize=100", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { data: [] } }) })
  })

  await page.route("**/api/upload", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          url: "https://blob.example.com/cover.jpg",
          filename: "cover.jpg",
          pathname: "uploads/creator-1/cover.jpg",
          size: 12,
          uploadedAt: new Date().toISOString(),
        },
      }),
    })
  })

  await page.route("**/api/manhwas", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { id: "manhwa-1" } }),
      })
      return
    }

    await route.continue()
  })

  await page.goto("/admin/upload-content")
  await page.getByRole("button", { name: /Nouveau Manhwa/i }).click()
  await page.getByLabel(/Titre du Manhwa/i).fill("My New Manhwa")
  await page.getByLabel(/Nom de l'Auteur/i).fill("Creator One")
  await page.getByLabel(/Description/i).fill("A fresh new fantasy action manhwa for ambitious readers.")
  await page.getByLabel(/Genres/i).fill("action, fantasy")

  const coverInput = page.locator('input[type="file"]')
  await coverInput.setInputFiles({
    name: "cover.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00]),
  })

  await expect(page.getByRole("button", { name: /Créer le Manhwa & Ajouter des Chapitres/i })).toBeEnabled()

  await page.getByRole("button", { name: /Créer le Manhwa & Ajouter des Chapitres/i }).click()
  await page.waitForURL("**/admin/upload-pages?manhwaId=manhwa-1")
  await expect(page).toHaveURL(/manhwaId=manhwa-1/)
})
