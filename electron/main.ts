import { registerDesktopFeatures, savedWindowBounds, saveWindowBounds } from "./desktopFeatures.ts";
import { installMacMenu } from "./macMenu.ts";
import { loadDesktopConfig } from "./runtimeConfig.ts";
import { app, BrowserWindow, dialog, ipcMain, nativeTheme, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServerApp } from "../server/app.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VITE_DEV_SERVER_URL = app.isPackaged
  ? undefined
  : process.env.VITE_DEV_SERVER_URL || undefined;

let win: BrowserWindow | null = null;
let menuReady = false;
const pendingCommands: string[] = [];

async function dispatchCommand(command: string) {
  if (!win) {
    try {
      const opening = createWindow();
      pendingCommands.push(command);
      await opening;
    } catch (error) {
      pendingCommands.length = 0;
      dialog.showErrorBox("Gamelog could not start", String(error));
      return;
    }
  } else if (menuReady) {
    win.webContents.send("gamelog:menu", command);
  } else {
    pendingCommands.push(command);
  }
  if (win?.isMinimized()) win.restore();
  win?.show();
  win?.focus();
}

ipcMain.on("gamelog:menu-ready", (event) => {
  if (!win || event.sender !== win.webContents) return;
  menuReady = true;
  for (const command of pendingCommands.splice(0)) win.webContents.send("gamelog:menu", command);
});

let serverPort: Promise<number> | undefined;
function startExpressServer(): Promise<number> {
  // IndexedDB is scoped to the origin, including the port. Keep it stable across launches.
  return (serverPort ??= new Promise((resolve, reject) => {
    const serverApp = createServerApp(path.join(__dirname, "../dist"));
    const port = Number(process.env.GAMELOG_PORT || 43821);
    const listener = serverApp.listen(port, "127.0.0.1", () => resolve(port));
    listener.on("error", reject);
  }));
}

let openingWindow: Promise<void> | undefined;
function createWindow() {
  return (openingWindow ??= openWindow().finally(() => {
    openingWindow = undefined;
  }));
}

async function openWindow() {
  loadDesktopConfig(app.getPath("userData"));
  const url = VITE_DEV_SERVER_URL ?? `http://127.0.0.1:${await startExpressServer()}`;
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    ...savedWindowBounds(),
    title: "Gamelog",
    minWidth: 640,
    minHeight: 520,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"), // vite-plugin-electron produces .mjs by default
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const window = win;
  const appOrigin = new URL(url).origin;
  const openExternalLink = (target: string) => {
    const link = URL.parse(target);
    if (link?.protocol !== "https:" && link?.protocol !== "http:") return;
    if (link.origin === appOrigin) return;
    void shell.openExternal(link.href).catch(() => {
      if (!window.isDestroyed()) {
        dialog.showErrorBox("Could not open link", "Open the link in your browser and try again.");
      }
    });
  };
  window.webContents.setWindowOpenHandler(({ url: target }) => {
    openExternalLink(target);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, target) => {
    if (URL.parse(target)?.origin === appOrigin) return;
    event.preventDefault();
    openExternalLink(target);
  });
  window.webContents.on("will-redirect", (event, target) => {
    if (URL.parse(target)?.origin !== appOrigin) event.preventDefault();
  });
  window.on("close", () => saveWindowBounds(window));
  window.webContents.on("did-start-navigation", (event) => {
    if (event.isMainFrame && !event.isSameDocument) menuReady = false;
  });
  window.on("closed", () => {
    menuReady = false;
    win = null;
  });
  try {
    await window.loadURL(url);
  } catch (error) {
    if (window.isDestroyed()) return;
    window.close();
    throw error;
  }
}

ipcMain.on("gamelog:theme", (event, mode: unknown) => {
  if (
    event.sender !== win?.webContents ||
    (mode !== "system" && mode !== "light" && mode !== "dark")
  )
    return;
  nativeTheme.themeSource = mode;
});
const hasLock = app.requestSingleInstanceLock();
if (!hasLock) app.quit();
else
  app
    .whenReady()
    .then(() => {
      app.setAboutPanelOptions({
        applicationName: "Gamelog",
        applicationVersion: app.getVersion(),
      });
      registerDesktopFeatures(
        () => win,
        (id) => {
          void dispatchCommand("game:" + id);
        }
      );
      installMacMenu(
        (command) => {
          void dispatchCommand(command);
        },
        () => win
      );
      return createWindow();
    })
    .catch((error: Error) => {
      dialog.showErrorBox("Gamelog could not start", error.message);
      app.quit();
    });
app.on("second-instance", () => {
  win?.show();
  win?.focus();
});

app.on("window-all-closed", () => {
  // Keep the Dock menu available after the last Mac window closes.
});

app.on("activate", () => {
  if (!win) {
    void createWindow().catch((error: Error) =>
      dialog.showErrorBox("Gamelog could not start", error.message)
    );
  }
});
