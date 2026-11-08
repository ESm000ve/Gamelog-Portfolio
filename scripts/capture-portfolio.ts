import { chromium, expect } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { once } from "node:events";

process.env.GAMELOG_WEB_ONLY = "1";
const { createServerApp } = await import("../server/app.ts");

// Recreates every image in docs/screenshots from the production build, using only
// the fictional demo library and mocked provider responses.
await mkdir("docs/screenshots", { recursive: true });
const fixture = await readFile("examples/demo-library.json");
const server = createServerApp("dist").listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
if (!address || typeof address === "string") throw new Error("Missing screenshot server");
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    colorScheme: "light",
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.setFixedTime(new Date("2026-10-28T12:00:00Z"));
  await page.route("**/api/**", (route) =>
    route.fulfill({
      json: new URL(route.request().url()).pathname.endsWith("/platforms") ? { platforms: [] } : [],
    })
  );
  await page.route("https://www.cheapshark.com/**", (route) => route.fulfill({ json: [] }));
  const base = `http://127.0.0.1:${address.port}`;
  await page.goto(`${base}/settings`);
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: "gamelog-portfolio-demo.json",
      mimeType: "application/json",
      buffer: fixture,
    });
  await page.getByRole("button", { name: "Merge (Add & Update)", exact: true }).click();
  await expect(page.getByText("Import completed successfully!", { exact: true })).toBeVisible();

  const settle = async () => {
    await page.evaluate(() => document.fonts.ready);
    await page
      .locator("img")
      .evaluateAll((images) =>
        Promise.all(images.map((image) => (image as HTMLImageElement).decode().catch(() => {})))
      );
  };
  for (const [route, name, heading] of [
    ["/", "library-light", "Library"],
    ["/recommend", "what-to-play", "What to play"],
    ["/activity", "activity", "Activity"],
    ["/stats", "statistics", "Statistics"],
    ["/lists", "collections", "Lists"],
  ]) {
    await page.goto(base + route);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await settle();
    await page.screenshot({ path: `docs/screenshots/${name}.png`, animations: "disabled" });
  }
  await page.goto(`${base}/settings`);
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.goto(base);
  await expect(page.getByRole("heading", { name: "Library", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await settle();
  await page.screenshot({ path: "docs/screenshots/library-dark.png", animations: "disabled" });
  if (errors.length) throw new Error(errors.join("\n"));
  console.log("Captured six production-app screenshots with fictional data and no provider requests.");
} finally {
  await browser.close();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );
}
