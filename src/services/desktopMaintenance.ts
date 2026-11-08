import { liveQuery } from "dexie";
import { db } from "../db/schema";
import { BackupRepo } from "../db/repositories/BackupRepo";
import { fetchDealsForWishlist } from "./priceTracker";
import type { Game } from "../types";

let checking: Promise<void> | undefined;

export async function checkAutomaticBackup() {
  if (!window.desktop?.backupDue || !window.desktop.writeBackup) return;
  if (await window.desktop.backupDue()) {
    await window.desktop.writeBackup(await BackupRepo.exportBackup());
  }
}

export function startDesktopMaintenance() {
  if (!window.desktop?.backupDue) return;
  const check = () => {
    checking ??= Promise.allSettled([
      checkAutomaticBackup(),
      (async () => {
        const ids = await db.logs.where("status").equals("Wishlist").primaryKeys();
        const games = (await db.games.bulkGet(ids)).filter((game): game is Game => Boolean(game));
        await fetchDealsForWishlist(games);
      })(),
    ])
      .then((results) => {
        for (const result of results)
          if (result.status === "rejected")
            console.warn("Gamelog background check failed.", result.reason);
      })
      .finally(() => {
        checking = undefined;
      });
  };
  check();
  const subscription = liveQuery(() => db.games.count()).subscribe({
    next: (count) => {
      if (count > 0)
        void checkAutomaticBackup().catch((error) =>
          console.warn("Gamelog automatic backup failed.", error)
        );
    },
    error: (error) => console.warn("Could not monitor the Gamelog library.", error),
  });
  const timer = window.setInterval(check, 60 * 60 * 1000);
  window.addEventListener("focus", check);
  return () => {
    subscription.unsubscribe();
    window.clearInterval(timer);
    window.removeEventListener("focus", check);
  };
}
