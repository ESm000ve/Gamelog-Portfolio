import { app, dialog, Menu, type MenuItemConstructorOptions, type BrowserWindow } from "electron";

export function installMacMenu(
  dispatch: (action: string) => void,
  getWindow: () => BrowserWindow | null
) {
  const command = (
    label: string,
    action: string,
    accelerator?: string
  ): MenuItemConstructorOptions => ({
    label,
    accelerator,
    click: () => dispatch(action),
  });

  app.dock?.setMenu(
    Menu.buildFromTemplate([
      command("Resume Playing", "resume-playing"),
      command("Add Game…", "add"),
      command("What to Play", "recommend"),
    ])
  );

  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: app.name,
        submenu: [
          { role: "about" },
          { type: "separator" },
          command("Settings…", "settings", "Command+,"),
          { type: "separator" },
          { role: "services" },
          { type: "separator" },
          { role: "hide" },
          { role: "hideOthers" },
          { role: "unhide" },
          { type: "separator" },
          { role: "quit" },
        ],
      },
      {
        label: "File",
        submenu: [
          command("Add Game…", "add", "Command+N"),
          { type: "separator" },
          { role: "close" },
        ],
      },
      {
        label: "Edit",
        submenu: [
          { role: "undo" },
          { role: "redo" },
          { type: "separator" },
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
          { role: "selectAll" },
          { type: "separator" },
          command("Search Games", "search", "Command+F"),
        ],
      },
      {
        label: "View",
        submenu: [
          command("Show or Hide Sidebar", "sidebar", "Command+Option+S"),
          command("Command Palette…", "commands", "Command+K"),
          { type: "separator" },
          { role: "resetZoom" },
          { role: "zoomIn" },
          { role: "zoomOut" },
          { type: "separator" },
          { role: "togglefullscreen" },
        ],
      },
      {
        label: "Go",
        submenu: [
          command("Back", "back", "Command+["),
          command("Forward", "forward", "Command+]"),
          { type: "separator" },
          command("Library", "library", "Command+1"),
          command("Lists", "lists", "Command+2"),
          command("Systems", "systems", "Command+3"),
          command("What to Play", "recommend", "Command+4"),
          command("Activity", "activity", "Command+5"),
          command("Friends", "friends", "Command+6"),
          command("Statistics", "stats", "Command+7"),
        ],
      },
      {
        label: "Play",
        submenu: [
          command("Start Play Timer", "timer-start"),
          command("Stop Timer and Save Session", "timer-stop"),
        ],
      },
      { role: "windowMenu" },
      {
        role: "help",
        submenu: [
          {
            label: "Gamelog Help",
            click: () => {
              const options = {
                type: "info" as const,
                title: "Gamelog Help",
                message: "Using Gamelog",
                detail: [
                  "Find a game with ⌘F, or add one with ⌘N. Use Library to track what you’re playing and What to Play to find your next game.",
                  "Use the Play menu to start and stop a timer. It tracks the open library game or the most recently updated Playing game and saves up to 24 hours to session history.",
                  "Open Settings → Backup and restore to find daily backups or restore one. From a list’s share dialog, choose Share via macOS to use the system Share menu.",
                ].join("\n\n"),
              };
              const window = getWindow();
              void (window
                ? dialog.showMessageBox(window, options)
                : dialog.showMessageBox(options));
            },
          },
        ],
      },
    ])
  );
}
