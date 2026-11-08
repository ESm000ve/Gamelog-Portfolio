import { useMemo } from "react";
import { countLibrary, sortLibrary, type LibrarySort } from "../services/libraryPresentation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import type { LibraryEntry } from "../types";
import { filterEntries, type FilterSpec } from "../services/filterEngine";

export type SortKey = LibrarySort;

interface UseLibraryOptions {
  filters?: FilterSpec;
  sort?: SortKey;
  search?: string;
}

/**
 * Reactive library hook.
 * Returns undefined while the initial IndexedDB query is loading.
 * After that, re-renders automatically on any db change.
 */
const noFilters: FilterSpec = {};

export function useLibrary({
  filters = noFilters,
  sort = "recent",
  search = "",
}: UseLibraryOptions = {}) {
  const library = useLiveQuery(async () => {
    const [games, logs] = await Promise.all([db.games.toArray(), db.logs.toArray()]);
    const logMap = new Map(logs.map((log) => [log.igdbId, log]));
    return games.flatMap((game): LibraryEntry[] => {
      const log = logMap.get(game.igdbId);
      return log ? [{ game, log }] : [];
    });
  });
  const sorted = useMemo(
    () => library && sortLibrary(filterEntries(library, filters), sort),
    [library, filters, sort]
  );
  const query = search.trim().toLowerCase();
  return query ? sorted?.filter(({ game }) => game.title.toLowerCase().includes(query)) : sorted;
}

/** Counts per status — used for the filter strip badges. */
export function useLibraryCounts() {
  return useLiveQuery(async () => {
    const [games, logs] = await Promise.all([db.games.toArray(), db.logs.toArray()]);
    return countLibrary(games, logs);
  });
}
