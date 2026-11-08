import Dexie, { type Table } from "dexie";
import type { RecoveryEntry } from "../types/recovery";

export const LIBRARY_SNAPSHOT_LIMIT = 10;

/** Use the index to read only keys, without loading the library copies. */
export async function pruneLibrarySnapshots(
  removals: Table<RecoveryEntry, string>,
  keep = LIBRARY_SNAPSHOT_LIMIT
) {
  const expired = await removals
    .where("[kind+removedAt]")
    .between(["library", Dexie.minKey], ["library", Dexie.maxKey], true, true)
    .reverse()
    .offset(keep)
    .primaryKeys();
  await removals.bulkDelete(expired);
}
