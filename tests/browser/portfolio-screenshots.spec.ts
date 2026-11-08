import { expect, test } from "@playwright/test";
import type { BackupData } from "../../src/services/backupFormat.ts";
import type { Status } from "../../src/types/index.ts";

const games = [
  { title: "Signal Coast", genre: "Adventure", color: "#0e6577", status: "Playing", hours: 8 },
  { title: "Glass Orchard", genre: "Puzzle", color: "#785290", status: "Backlog", hours: 5 },
  { title: "Amber Circuit", genre: "Racing", color: "#a85130", status: "Backlog", hours: 12 },
  { title: "North of Ember", genre: "Adventure", color: "#375886", status: "Played", hours: 18 },
  { title: "Little Tides", genre: "Simulation", color: "#34694f", status: "Played", hours: 7 },
  { title: "Paper Comet", genre: "Platformer", color: "#9b4966", status: "Wishlist", hours: 4 },
] satisfies { title: string; genre: string; color: string; status: Status; hours: number }[];

const fixedDate = new Date("2026-10-28T12:00:00Z");
const savedAt = fixedDate.getTime();
const fixture: BackupData = {
  version: 2,
  games: games.map((game, index) => ({
    igdbId: 9401 + index,
    title: game.title,
    slug: game.title.toLowerCase().replaceAll(" ", "-"),
    developer: "Gamelog Demo Studio",
    releaseYear: 2024 + (index % 3),
    genres: [game.genre],
    platforms: [index % 2 ? "Nintendo Switch" : "PC"],
    coverUrl: `https://portfolio.gamelog.invalid/cover/${index}.svg`,
    timeToBeat: { finish: game.hours },
    addedAt: savedAt - index * 1000,
    updatedAt: savedAt,
  })),
  logs: games.map((game, index) => ({
    igdbId: 9401 + index,
    status: game.status,
    createdAt: savedAt,
    updatedAt: savedAt,
    ...(game.status === "Playing" && {
      startedAt: "2026-10-24",
      timePlayed: 3,
      playSessions: [
        { date: "2026-10-24", durationMinutes: 120 },
        { date: "2026-10-27", durationMinutes: 60 },
      ],
    }),
    ...(game.status === "Played" && {
      completion: "Completed" as const,
      finishedAt: `2026-10-2${index}`,
      rating: 4.5,
      timePlayed: game.hours,
      playSessions: [{ date: `2026-10-2${index}`, durationMinutes: 90 }],
    }),
  })),
  lists: [],
  tags: [],
};

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
  await page.route("https://portfolio.gamelog.invalid/cover/*", (route) => {
    const index = Number(new URL(route.request().url()).pathname.split("/").at(-1)?.split(".")[0]);
    const { title, color } = games[index];
    return route.fulfill({
      contentType: "image/svg+xml",
      body: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 480">
        <rect width="360" height="480" fill="${color}"/>
        <circle cx="${108 + index * 27}" cy="${124 + (index % 3) * 22}" r="64" fill="#f9e7bd"/>
        <path d="M0 335 112 184 219 325 308 211 360 280V480H0Z" fill="#11212c" opacity=".66"/>
        <path d="M0 374 100 283 201 350 360 281V480H0Z" fill="#101924" opacity=".8"/>
        <text x="24" y="434" fill="#fff6df" font-family="sans-serif" font-size="28" font-weight="bold">${title}</text>
      </svg>`,
    });
  });

  await page.goto("/settings");
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: "gamelog-portfolio-demo.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(fixture)),
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
