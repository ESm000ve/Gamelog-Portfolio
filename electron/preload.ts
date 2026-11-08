import { contextBridge, ipcRenderer } from "electron";
// Expose only the desktop actions the renderer uses.
contextBridge.exposeInMainWorld("desktop", {
  platform: process.platform,
  isElectron: true,
  onMenuCommand: (callback: (action: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, action: string) => callback(action);
    ipcRenderer.on("gamelog:menu", listener);
    ipcRenderer.send("gamelog:menu-ready");
    return () => ipcRenderer.removeListener("gamelog:menu", listener);
  },
  backupDue: () => ipcRenderer.invoke("gamelog:backup-due"),
  writeBackup: (data: string) => ipcRenderer.invoke("gamelog:backup-write", data),
  openBackupFolder: () => ipcRenderer.invoke("gamelog:backup-folder"),
  shareList: (text: string) => ipcRenderer.invoke("gamelog:share-list", text),
  notifyPriceDrop: (deal: { id: number; title: string; before: number; price: number }) =>
    ipcRenderer.invoke("gamelog:price-drop", deal),
  setTheme: (mode: string) => ipcRenderer.send("gamelog:theme", mode),
});
