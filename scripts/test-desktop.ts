import assert from "node:assert/strict";
import { _electron as electron, expect } from "@playwright/test";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { mkdtemp, writeFile, rm, mkdir, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
const require = createRequire(import.meta.url);
const root = path.resolve(process.argv[2] ?? ".");
const bundle = path.join(root, "dist-electron/main.js");
const executablePath = process.env.GAMELOG_ELECTRON_EXECUTABLE;
const showForDragCheck = process.argv.includes("--show");
const scratch = await mkdtemp(path.join(tmpdir(), "gamelog-desktop-test-"));
await mkdir(path.join(scratch, "profile"));
await writeFile(
  path.join(scratch, "profile", ".env"),
  "GEMINI_API_KEY=desktop-test-key\n"
);
const probe = createServer();
await new Promise<void>((resolve) => probe.listen(0, "127.0.0.1", resolve));
const address = probe.address();
assert.ok(address && typeof address !== "string");
const port = address.port;
await new Promise<void>((resolve) => probe.close(() => resolve()));
const harness = path.join(scratch, "main.cjs");
await writeFile(
  harness,
  `
const electron = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const url = require("node:url");
const moduleAPI = require("node:module");
const ts = require(${JSON.stringify(require.resolve("typescript"))});
electron.app.setName("Gamelog Desktop Verification");
electron.app.setPath("userData", ${JSON.stringify(path.join(scratch, "profile"))});
class HiddenWindow extends electron.BrowserWindow {
  constructor(options) {
    super({ ...options, show: ${showForDragCheck} });
    globalThis.__gamelogNativeWindow = this;
    if (${showForDragCheck}) this.on("page-title-updated", (event) => { event.preventDefault(); this.setTitle("Gamelog drag verification"); });
  }
}
globalThis.__externalLinks = [];
globalThis.__nativeShares = [];
globalThis.__priceAlerts = [];
class TestNotification extends require("node:events").EventEmitter {
  static isSupported() { return true; }
  constructor(options) { super(); this.options = options; }
  show() { globalThis.__priceAlerts.push(this.options.body); }
}
const facade = {
  ...electron,
  BrowserWindow: HiddenWindow,
  Notification: TestNotification,
  ShareMenu: class { constructor(items) { globalThis.__nativeShares.push(items.texts[0]); } popup() {} },
  shell: { openExternal: async (url) => { globalThis.__externalLinks.push(url); } },
};
const bundle = ${JSON.stringify(bundle)};
const baseRequire = moduleAPI.createRequire(url.pathToFileURL(bundle));
function runtimeRequire(id) {
  if (id === "electron") return facade;
  if (id === "node:module" || id === "module") return { ...moduleAPI, createRequire: () => runtimeRequire };
  return baseRequire(id);
}
const source = fs.readFileSync(bundle, "utf8").replaceAll("import.meta.url", JSON.stringify(url.pathToFileURL(bundle).href));
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const providerFetch = async (_url, options) => {
  if (options?.headers?.["x-goog-api-key"] !== "desktop-test-key") throw new Error("Private desktop key was not loaded");
  return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ target: "igdb", igdbSearchQuery: "short", filters: {} }) }] } }] }) };
};
vm.runInNewContext(code, { exports: {}, require: runtimeRequire, console, process, Buffer, URL, URLSearchParams, TextDecoder, TextEncoder, AbortSignal, AbortController, setTimeout, clearTimeout, setInterval, clearInterval, fetch: providerFetch }, { filename: bundle });
`
);
let desktop: Awaited<ReturnType<typeof electron.launch>> | undefined;
try {
  desktop = await electron.launch({
    args: [harness],
    executablePath,
    cwd: scratch,
    env: {
      ...process.env,
      GAMELOG_PORT: String(port),
      VITE_DEV_SERVER_URL: "",
      GEMINI_API_KEY: "",
    },
    timeout: 30000,
  });
  const page = await desktop.firstWindow();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/**", (route) =>
    route.fulfill({ json: route.request().url().includes("/platforms") ? { platforms: [] } : [] })
  );
  await page.getByRole("heading", { name: "Library", exact: true }).waitFor();
  const dragRegions = await page.evaluate(() =>
    Object.fromEntries(
      [
        ".app-titlebar",
        ".app-titlebar-brand",
        ".app-titlebar-brand button",
        ".app-titlebar-search",
        ".app-titlebar-trailing",
        ".app-titlebar-search .fui-Combobox",
        ".app-titlebar-trailing button",
      ].map((selector) => [
        selector,
        getComputedStyle(document.querySelector(selector)!).getPropertyValue("-webkit-app-region"),
      ])
    )
  );
  for (const selector of [
    ".app-titlebar",
    ".app-titlebar-brand",
    ".app-titlebar-search",
    ".app-titlebar-trailing",
  ])
    assert.equal(dragRegions[selector], "drag", selector + " must allow window dragging");
  for (const selector of [
    ".app-titlebar-search .fui-Combobox",
    ".app-titlebar-trailing button",
    ".app-titlebar-brand button",
  ])
    assert.equal(dragRegions[selector], "no-drag", selector + " must remain interactive");
  const keyCheck = await page.evaluate(async () => {
    const result = await fetch("/api/ai/parse-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "short games" }),
    });
    return { status: result.status, body: await result.text() };
  });
  assert.equal(keyCheck.status, 200, "Desktop must load its private .env: " + keyCheck.body);
  await page.evaluate(() => {
    const link = document.createElement("a");
    link.href = "https://example.com/game";
    link.target = "_blank";
    link.click();
    window.open("file:///tmp/gamelog-test");
  });
  await expect
    .poll(() =>
      desktop!.evaluate(
        () => (globalThis as unknown as { __externalLinks: string[] }).__externalLinks
      )
    )
    .toEqual(["https://example.com/game"]);
  assert.equal(desktop.windows().length, 1, "External links must not create app windows");
  const bridge = await page.evaluate(
    () => (window as unknown as { desktop?: { platform: string; isElectron: boolean } }).desktop
  );
  assert.equal(bridge?.isElectron, true, "Real preload bridge must load");
  assert.equal(bridge?.platform, process.platform);
  {
    const menuNames = await desktop.evaluate(({ Menu }) =>
      Menu.getApplicationMenu()?.items.map((item) => item.label)
    );
    assert.ok(menuNames?.includes("File") && menuNames.includes("Go"));
    await page.getByRole("button", { name: "Hide sidebar" }).click();
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(0);
    await page.getByRole("button", { name: "Show sidebar" }).click();
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    await desktop.evaluate(({ Menu, BrowserWindow }) => {
      const settings = Menu.getApplicationMenu()?.items[0].submenu?.items.find(
        (item) => item.label === "Settings…"
      );
      settings?.click(settings, BrowserWindow.getAllWindows()[0], {} as Electron.KeyboardEvent);
    });
  }
  await page.getByRole("heading", { name: "Settings", exact: true }).waitFor();
  const chooseTheme = (name: string) => page.getByRole("button", { name, exact: true }).click();
  await chooseTheme("Dark");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(30, 30, 30)");
  await chooseTheme("Light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(246, 246, 248)");
  await expect(page.locator(".platform-provider").first()).toHaveCSS(
    "background-color",
    "rgb(246, 246, 248)"
  );
  await expect(page.locator("body")).toHaveCSS("color", "rgb(0, 0, 0)");
  await expect
    .poll(() => desktop!.evaluate(({ nativeTheme }) => nativeTheme.themeSource))
    .toBe("light");
  await page.reload();
  await expect(page.getByRole("button", { name: "Light", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(246, 246, 248)");
  const menuLabels = await desktop.evaluate(({ Menu, app }) => ({
    menu: Menu.getApplicationMenu()?.items.flatMap(
      (item) => item.submenu?.items.map((entry) => entry.label) ?? []
    ),
    dock: app.dock?.getMenu()?.items.map((item) => item.label),
  }));
  assert.ok(menuLabels.menu?.includes("Gamelog Help"));
  assert.ok(menuLabels.menu?.includes("Start Play Timer"));
  assert.ok(menuLabels.dock?.includes("Resume Playing"));
  const fixture = {
    version: 2,
    games: [
      {
        igdbId: 901,
        title: "Desktop Verification Game",
        slug: "desktop-test",
        developer: "Test",
        releaseYear: 2024,
        firstReleaseDate: 1704067200,
        genres: [],
        platforms: ["PC"],
        addedAt: 1,
        updatedAt: 1,
      },
    ],
    logs: [
      {
        igdbId: 901,
        status: "Playing",
        notes: "Isolated desktop test",
        createdAt: 1,
        updatedAt: 1,
      },
    ],
    lists: [],
    tags: [],
  };
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: "desktop-test.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(fixture)),
    });
  await page.getByRole("button", { name: "Merge (Add & Update)", exact: true }).click();
  await page.getByText("Import completed successfully!", { exact: true }).waitFor();
  const backupDir = path.join(scratch, "profile", "Backups");
  await expect.poll(async () => await readdir(backupDir).catch(() => [])).toHaveLength(1);
  const [backupFile] = await readdir(backupDir);
  const backup = JSON.parse(await readFile(path.join(backupDir, backupFile), "utf8"));
  assert.equal(backup.games[0].igdbId, 901);
  assert.equal(
    await page.evaluate(() =>
      (window as Window & { desktop?: { backupDue(): Promise<boolean> } }).desktop?.backupDue()
    ),
    false
  );
  const clickMenu = (label: string) =>
    desktop!.evaluate(({ Menu, BrowserWindow }, label) => {
      const item = Menu.getApplicationMenu()
        ?.items.flatMap((entry) => entry.submenu?.items ?? [])
        .find((entry) => entry.label === label);
      if (!item) throw new Error("Menu command not found");
      item.click(item, BrowserWindow.getAllWindows()[0], {} as Electron.KeyboardEvent);
    }, label);
  await clickMenu("Start Play Timer");
  await expect(
    page.getByText("Play timer started for Desktop Verification Game", { exact: true })
  ).toBeVisible();
  await clickMenu("Stop Timer and Save Session");
  await expect(page.getByText(/Saved .*Desktop Verification Game’s session history/)).toBeVisible();
  const expectedBounds = await desktop.evaluate(({ screen }) => {
    const window = (globalThis as unknown as { __gamelogNativeWindow: Electron.BrowserWindow })
      .__gamelogNativeWindow;
    const area = screen.getPrimaryDisplay().workArea;
    window.setBounds({ x: area.x + 40, y: area.y + 40, width: 900, height: 650 });
    return window.getNormalBounds();
  });
  await page.getByRole("link", { name: "Library", exact: true }).click();
  await page.getByRole("heading", { name: "Desktop Verification Game", exact: true }).waitFor();
  await page.getByRole("button", { name: "Share & Export Library", exact: true }).click();
  await page.getByRole("button", { name: "Share via macOS", exact: true }).click();
  await expect
    .poll(() =>
      desktop!.evaluate(
        () => (globalThis as unknown as { __nativeShares: string[] }).__nativeShares[0]
      )
    )
    .toContain("Desktop Verification Game");
  await page.keyboard.press("Escape");
  await page.evaluate(async () => {
    const bridge = (
      window as Window & {
        desktop?: {
          notifyPriceDrop(deal: {
            id: number;
            title: string;
            before: number;
            price: number;
          }): Promise<void>;
        };
      }
    ).desktop;
    await bridge?.notifyPriceDrop({
      id: 901,
      title: "Desktop Verification Game",
      before: 20,
      price: 20,
    });
    await bridge?.notifyPriceDrop({
      id: 901,
      title: "Desktop Verification Game",
      before: 20,
      price: 10,
    });
  });
  assert.deepEqual(
    await desktop.evaluate(
      () => (globalThis as unknown as { __priceAlerts: string[] }).__priceAlerts
    ),
    ["Desktop Verification Game went from $20.00 to $10.00 USD."]
  );
  await page.reload();
  await page.getByRole("heading", { name: "Desktop Verification Game", exact: true }).waitFor();
  for (const [link, heading] of [
    ["Lists", "Lists"],
    ["Systems", "Systems"],
    ["Activity", "Activity"],
    ["Statistics", "Statistics"],
  ]) {
    await page.getByRole("link", { name: link, exact: true }).click();
    await page.getByRole("heading", { name: heading, exact: true, level: 1 }).waitFor();
  }
  assert.deepEqual(errors, []);
  if (!showForDragCheck) {
    await desktop.close();
    desktop = await electron.launch({
      args: [harness],
      executablePath,
      cwd: scratch,
      env: {
        ...process.env,
        GAMELOG_PORT: String(port),
        VITE_DEV_SERVER_URL: "",
        GEMINI_API_KEY: "",
      },
      timeout: 30000,
    });
    const reopened = await desktop.firstWindow();
    await reopened
      .getByRole("heading", { name: "Desktop Verification Game", exact: true })
      .waitFor();
    await expect(reopened.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(reopened.locator("body")).toHaveCSS("background-color", "rgb(246, 246, 248)");
    await expect
      .poll(() => desktop!.evaluate(({ nativeTheme }) => nativeTheme.themeSource))
      .toBe("light");
    assert.deepEqual(
      await desktop.evaluate(() =>
        (
          globalThis as unknown as { __gamelogNativeWindow: Electron.BrowserWindow }
        ).__gamelogNativeWindow.getNormalBounds()
      ),
      expectedBounds
    );
    assert.equal((await readdir(backupDir)).length, 1);
    await reopened.close();
    const [dockWindow] = await Promise.all([
      desktop.waitForEvent("window"),
      desktop.evaluate(({ app }) => {
        const item = app.dock?.getMenu()?.items.find((entry) => entry.label === "Resume Playing");
        if (!item) throw new Error("Dock resume command is missing");
        item.click(item, undefined, {} as Electron.KeyboardEvent);
      }),
    ]);
    await expect(dockWindow).toHaveURL(/\/game\/901$/);
    console.log("The Dock reopened the window and resumed the Playing game.");
    console.log("Full native process restart preserved the saved library and light theme.");
  }
  if (showForDragCheck) {
    console.log(
      "Ready for native drag verification; close only the verification window when finished."
    );
    await new Promise<void>((resolve) => desktop!.on("close", () => resolve()));
    desktop = undefined;
  }
  console.log(
    "Native desktop passed: real desktop bridge, drag/control regions, private key loading over an empty launcher variable, HTTP assets, backup import, persistence, and lazy navigation. Only an isolated temporary profile was used."
  );
} finally {
  await desktop?.close();
  // scratch is generated by mkdtemp under the OS temp folder, never user storage.
  assert.ok(scratch.startsWith(path.join(tmpdir(), "gamelog-desktop-test-")));
  await rm(scratch, { recursive: true, force: true });
}
