import { db } from "../db/schema";
import { localDate } from "../utils/dates";

export async function currentPlayingGame() {
  const logs = await db.logs.where("status").equals("Playing").toArray();
  logs.sort((a, b) => b.updatedAt - a.updatedAt);
  for (const log of logs) {
    const game = await db.games.get(log.igdbId);
    if (game) return game;
  }
}

export async function startPlayTimer(preferredGame?: number) {
  return db.transaction("rw", [db.playTimer, db.games, db.logs], async () => {
    if (await db.playTimer.get("active")) throw new Error("A play timer is already running.");
    const preferred = preferredGame === undefined ? undefined : await db.logs.get(preferredGame);
    const game = preferred ? await db.games.get(preferred.igdbId) : await currentPlayingGame();
    const log = game && (await db.logs.get(game.igdbId));
    if (!game || !log) throw new Error("Open a game in your library or mark one as Playing first.");
    await db.playTimer.add({
      id: "active",
      gameId: game.igdbId,
      title: game.title,
      startedAt: Date.now(),
      logCreatedAt: log.createdAt,
    });
    return game.title;
  });
}

export async function stopPlayTimer() {
  return db.transaction("rw", [db.playTimer, db.logs], async () => {
    const timer = await db.playTimer.get("active");
    if (!timer) throw new Error("No play timer is running.");
    const log = await db.logs.get(timer.gameId);
    await db.playTimer.delete("active");
    if (!log || log.createdAt !== timer.logCreatedAt) return null;
    // Session history accepts a maximum of 24 hours per entry.
    const minutes = Math.min(1440, Math.max(0, Math.round((Date.now() - timer.startedAt) / 60000)));
    await db.logs.update(timer.gameId, {
      playSessions: [
        ...(log.playSessions ?? []),
        {
          date: localDate(new Date(timer.startedAt)),
          durationMinutes: minutes,
        },
      ],
      updatedAt: Date.now(),
    });
    return { title: timer.title, minutes };
  });
}
