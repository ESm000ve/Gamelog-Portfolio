import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const demo = new URL("../../examples/demo-library.json", import.meta.url);
const fixture = readFileSync(demo);
const fixedDate = new Date("2026-10-28T12:00:00Z");

test("capture the library, recommendations and activity with a fictional collection", async ({
  page,
}, testInfo) => {
  await page.clock.setFixedTime(fixedDate);
  await page.route("**/api/**", (route) =>
    route.fulfill({
      json: new URL(route.request().url()).pathname.endsWith("/platforms") ? { platforms: [] } : [],
    })
  );
  await page.route("https://www.cheapshark.com/**", (route) => route.fulfill({ json: [] }));
  await page.goto("/settings");
  await page.locator('input[type="file"]').first().setInputFiles({
    name: "gamelog-portfolio-demo.json",
    mimeType: "application/json",
    buffer: fixture,
  });
  await page.getByRole("button", { name: "Merge (Add & Update)", exact: true }).click();
  await expect(page.getByText("Import completed successfully!", { exact: true })).toBeVisible();

  for (const screen of [
    { route: "/", title: "Library", ready: "Signal Coast", file: "01-library.png" },
    {
      route: "/recommend",
      title: "What to play",
      ready: "Glass Orchard",
      file: "02-what-to-play.png",
    },
    { route: "/activity", title: "Activity", ready: "Play summary", file: "03-activity.png" },
  ]) {
    await page.goto(screen.route);
    await expect(page.getByRole("heading", { name: screen.title, exact: true })).toBeVisible();
    await expect(page.getByText(screen.ready).first()).toBeVisible();
    await page
      .locator("img")
      .evaluateAll((images) =>
        Promise.all(images.map((image) => (image as HTMLImageElement).decode().catch(() => {})))
      );
    await page.screenshot({ path: testInfo.outputPath(screen.file), animations: "disabled" });
  }
});
