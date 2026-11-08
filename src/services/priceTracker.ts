import { db } from "../db/schema";
import type { Game } from "../types";

// Recheck at most once per day per game while the app is running.
const pendingDeals = new Map<number, Promise<void>>();
const checkedAt = new Map<number, number>();

/**
 * Fetches the current cheapest deals for a list of games from CheapShark.
 * Updates the local database with the deal price and redirect URL.
 */
export async function fetchDealsForWishlist(games: Game[]): Promise<void> {
  await Promise.all(
    games.map((game) => {
      const pending = pendingDeals.get(game.igdbId);
      if (pending) return pending;
      if (Date.now() - (checkedAt.get(game.igdbId) ?? 0) < 24 * 60 * 60 * 1000)
        return Promise.resolve();
      checkedAt.set(game.igdbId, Date.now());
      const task = (async () => {
        try {
          const res = await fetch(
            `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(game.title)}&limit=3`,
            { signal: AbortSignal.timeout(8000) }
          );
          if (!res.ok) return;
          const data: unknown = await res.json();
          const key = (value: string) =>
            value
              .trim()
              .toLowerCase()
              .replace(/[^\p{L}\p{N}]/gu, "");
          const deal = Array.isArray(data)
            ? data.find(
                (item) =>
                  item &&
                  typeof item.external === "string" &&
                  key(item.external) === key(game.title)
              )
            : undefined;
          if (
            !deal ||
            typeof deal.cheapest !== "string" ||
            !deal.cheapest.trim() ||
            typeof deal.cheapestDealID !== "string" ||
            !deal.cheapestDealID
          )
            return;
          const price = Number(deal.cheapest);
          if (!Number.isFinite(price) || price < 0) return;
          const url = `https://www.cheapshark.com/redirect?dealID=${encodeURIComponent(deal.cheapestDealID)}`;
          const before = await db.transaction("rw", [db.games, db.logs], async () => {
            const current = await db.games.get(game.igdbId);
            if (!current || (await db.logs.get(game.igdbId))?.status !== "Wishlist") return;
            await db.games.update(game.igdbId, { dealPrice: price, dealUrl: url });
            return current.dealPrice;
          });
          if (before !== undefined && price < before)
            await globalThis.window?.desktop?.notifyPriceDrop?.({
              id: game.igdbId,
              title: game.title,
              before,
              price,
            });
        } catch (error) {
          console.warn(`Could not check deals for ${game.title}`, error);
        }
      })().finally(() => {
        pendingDeals.delete(game.igdbId);
      });
      pendingDeals.set(game.igdbId, task);
      return task;
    })
  );
}
