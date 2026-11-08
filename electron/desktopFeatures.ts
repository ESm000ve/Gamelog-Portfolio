import {
  app,
  ipcMain,
  Notification,
  screen,
  ShareMenu,
  shell,
  type BrowserWindow,
  type Rectangle,
} from "electron";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { localDate } from "../src/utils/dates.ts";

const profilePath = (name: string) => path.join(app.getPath("userData"), name);
const backupDirectory = () => profilePath("Backups");
const backupPath = () => path.join(backupDirectory(), "gamelog-backup-" + localDate() + ".json");

export function savedWindowBounds(): Partial<Rectangle> {
  try {
    const saved: Rectangle = JSON.parse(readFileSync(profilePath("window-bounds.json"), "utf8"));
    if (
      ![saved.x, saved.y, saved.width, saved.height].every(Number.isFinite) ||
      saved.width < 640 ||
      saved.height < 520
    )
      return {};
    const { workArea } = screen.getDisplayMatching(saved);
    const width = Math.min(saved.width, workArea.width);
    const height = Math.min(saved.height, workArea.height);
    return {
      width,
      height,
      x: Math.max(workArea.x, Math.min(saved.x, workArea.x + workArea.width - width)),
      y: Math.max(workArea.y, Math.min(saved.y, workArea.y + workArea.height - height)),
    };
  } catch {
    return {};
  }
}

export function saveWindowBounds(window: BrowserWindow) {
  try {
    mkdirSync(app.getPath("userData"), { recursive: true });
    writeFileSync(profilePath("window-bounds.json"), JSON.stringify(window.getNormalBounds()));
  } catch (error) {
    console.warn("Could not save window bounds.", error);
  }
}

export function registerDesktopFeatures(
  getWindow: () => BrowserWindow | null,
  openGame: (id: number) => void
) {
  const handle = (channel: string, action: (value: unknown, window: BrowserWindow) => unknown) =>
    ipcMain.handle("gamelog:" + channel, (event, value: unknown) => {
      const window = getWindow();
      if (!window || event.sender !== window.webContents)
        throw new Error("This action must come from the Gamelog window.");
      return action(value, window);
    });

  handle("backup-due", () => !existsSync(backupPath()));
  let writing: Promise<boolean> | undefined;
  handle("backup-write", (value) => {
    if (typeof value !== "string") throw new Error("Invalid backup.");
    const data = JSON.parse(value);
    if (
      data.version !== 2 ||
      !["games", "logs", "lists", "tags"].every((key) => Array.isArray(data[key]))
    )
      throw new Error("Invalid backup.");
    if (existsSync(backupPath())) return false;
    if (!data.games.length && !data.logs.length && !data.lists.length && !data.tags.length)
      return false;
    return (writing ??= (async () => {
      const destination = backupPath();
      const temporary = destination + "." + randomUUID() + ".tmp";
      await mkdir(backupDirectory(), { recursive: true, mode: 0o700 });
      try {
        await writeFile(temporary, value, { flag: "wx", mode: 0o600 });
        await rename(temporary, destination);
      } finally {
        await rm(temporary, { force: true });
      }
      return true;
    })().finally(() => {
      writing = undefined;
    }));
  });
  handle("backup-folder", async () => {
    await mkdir(backupDirectory(), { recursive: true, mode: 0o700 });
    if (await shell.openPath(backupDirectory()))
      throw new Error("Could not open the backup folder.");
  });
  handle("share-list", (value, window) => {
    if (typeof value !== "string" || !value.trim()) throw new Error("There is no list to share.");
    new ShareMenu({ texts: [value] }).popup({ window });
  });
  const notifications = new Map<number, Notification>();
  handle("price-drop", (value) => {
    const deal = value as {
      id?: unknown;
      title?: unknown;
      before?: unknown;
      price?: unknown;
    } | null;
    if (
      !deal ||
      typeof deal.id !== "number" ||
      !Number.isSafeInteger(deal.id) ||
      deal.id <= 0 ||
      typeof deal.title !== "string" ||
      typeof deal.before !== "number" ||
      !Number.isFinite(deal.before) ||
      typeof deal.price !== "number" ||
      !Number.isFinite(deal.price) ||
      deal.price < 0 ||
      deal.price >= deal.before ||
      !Notification.isSupported()
    )
      return;
    const id = deal.id;
    const notification = new Notification({
      title: "Wishlist price drop",
      body: `${deal.title.slice(0, 150)} went from $${deal.before.toFixed(2)} to $${deal.price.toFixed(2)} USD.`,
    });
    notifications.get(id)?.close();
    notifications.set(id, notification);
    const forget = () => {
      if (notifications.get(id) === notification) notifications.delete(id);
    };
    notification.once("close", forget);
    notification.once("click", () => {
      forget();
      openGame(id);
    });
    notification.show();
  });
}
