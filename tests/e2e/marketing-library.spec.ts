import { expect, test, type Page } from "@playwright/test";

const runAuthenticatedMarketingLibrary =
  process.env.E2E_MARKETING_LIBRARY === "true";
const password = process.env.E2E_MARKETING_LIBRARY_PASSWORD ?? "LocalTest123!";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
}

async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
}

test("Marketing Library upload, publish, sharing, and revoke workflow", async ({
  browser,
  page
}) => {
  test.skip(
    !runAuthenticatedMarketingLibrary,
    "Set E2E_MARKETING_LIBRARY=true with seeded role accounts to run this flow."
  );
  const assetTitle = `QA Tomato Product Leaflet ${Date.now()}`;

  await login(
    page,
    process.env.E2E_MARKETING_HEAD_EMAIL ?? "marketing-head@jivawater.com"
  );
  await page.goto("/marketing-library/new");

  await page.getByLabel("Audience").selectOption("Farmers");
  await page.getByLabel("Sector").selectOption("Agriculture");
  await expect(page.getByText("Key crops")).toBeVisible();
  await page.getByRole("checkbox", { name: "Tomato" }).check();
  await page.getByLabel("Language").selectOption("English");
  await page.getByLabel("Title").fill(assetTitle);
  await page.getByLabel("Asset type").selectOption("Leaflet");
  await page.getByLabel("Delivery format").selectOption("Digital");
  await page.getByLabel("Description").fill("Approved product leaflet for tomato growers.");
  await page.locator('input[type="file"]').setInputFiles({
    buffer: Buffer.from("%PDF-1.4\n% Jiva QA marketing asset\n"),
    mimeType: "application/pdf",
    name: "qa-tomato-leaflet.pdf"
  });
  await page.getByRole("button", { name: "Publish material" }).click();
  await expect(page).toHaveURL(/\/marketing-library\/[0-9a-f-]+$/i, {
    timeout: 30_000
  });
  await expect(
    page.locator("span").filter({ hasText: /^Published$/ }).first()
  ).toBeVisible();
  const assetUrl = page.url();

  await signOut(page);
  await login(page, process.env.E2E_VIEWER_EMAIL ?? "viewer@jivawater.com");
  await page.goto("/marketing-library");
  await expect(page.getByRole("link", { name: assetTitle })).toBeVisible();
  await expect(page.getByRole("link", { name: "Upload material" })).toHaveCount(0);

  await signOut(page);
  await login(
    page,
    process.env.E2E_MARKETING_HEAD_EMAIL ?? "marketing-head@jivawater.com"
  );
  await page.goto(assetUrl);
  await page.getByRole("button", { name: "Create customer link" }).click();
  await expect(page.getByText("Customer link created", { exact: true })).toBeVisible();
  const customerUrl = await page.locator("p.break-all").textContent();
  expect(customerUrl).toMatch(/\/share\/marketing\/[A-Za-z0-9_-]{43}$/);

  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();
  await publicPage.goto(customerUrl!);
  await expect(
    publicPage.getByRole("heading", { name: assetTitle })
  ).toBeVisible();
  await expect(publicPage.getByRole("link", { name: "Open material" })).toBeVisible();

  await page.getByRole("button", { name: "Revoke" }).click();
  await expect(page.getByText("Revoked", { exact: true })).toBeVisible();
  await publicPage.reload();
  await expect(publicPage.getByText("This page could not be found.")).toBeVisible();
  await publicContext.close();
});
