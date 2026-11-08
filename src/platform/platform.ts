declare global {
  interface Window {
    desktop?: {
      platform: string;
      isElectron: boolean;
      onMenuCommand?: (callback: (action: string) => void) => () => void;
      backupDue?: () => Promise<boolean>;
      writeBackup?: (data: string) => Promise<boolean>;
      openBackupFolder?: () => Promise<void>;
      shareList?: (text: string) => Promise<void>;
      notifyPriceDrop?: (deal: {
        id: number;
        title: string;
        before: number;
        price: number;
      }) => Promise<void>;
      setTheme?: (mode: "system" | "light" | "dark") => void;
    };
  }
}
export const shortcutModifier = "⌘";
