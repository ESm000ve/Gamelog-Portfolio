import "fake-indexeddb/auto";
import Dexie from "dexie";
import { startPlayTimer, stopPlayTimer } from "../src/services/playTimer";
import { localDate } from "../src/utils/dates";
import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/db/schema";
import { RecoveryRepo } from "../src/db/repositories/RecoveryRepo";
import { BackupRepo } from "../src/db/repositories/BackupRepo";
import { GamesRepo } from "../src/db/repositories/GamesRepo";
import type { Game, Log } from "../src/types";
const game = (id: number): Game => ({
  igdbId: id,
  title: `Game ${id}`,
  slug: `game-${id}`,
  developer: "Studio",
  genres: [],
  platforms: ["PC"],
  releaseYear: 2026,
  addedAt: 1,
  updatedAt: 1,
});
const log = (id: number): Log => ({
  igdbId: id,
  status: "Played",
  rating: 4.5,
  notes: "Keep these notes",
  tagIds: ["favorite"],
  playSessions: [{ date: "2026-10-27", durationMinutes: 60 }],
  createdAt: 1,
  updatedAt: 1,
});
beforeEach(async () => {
  await Promise.all(db.tables.map((table) => table.clear()));
  await db.games.bulkPut([game(1), game(2), game(3)]);
  await db.logs.bulkPut([log(1), log(2), log(3)]);
  await db.tags.put({ id: "favorite", name: "Favorite", createdAt: 1, updatedAt: 1 });
  await db.lists.put({
    id: "ranked",
    name: "Favorites",
    isRanked: true,
    gameIds: [1, 2, 3],
    createdAt: 1,
    updatedAt: 1,
  });
});
after(() => db.close());
globalThis.fetch = async () => {
  throw new Error("No network in recovery tests");
};

test("removed games recover personal logs, tags, play sessions, and ranked list positions", async () => {
  const id = await RecoveryRepo.removeGame(2);
  assert.ok(id);
  assert.equal(await db.games.get(2), undefined);
  assert.deepEqual((await db.lists.get("ranked"))?.gameIds, [1, 3]);
  await db.tags.delete("favorite");
  await RecoveryRepo.restore(id);
  assert.equal((await db.logs.get(2))?.notes, "Keep these notes");
  assert.equal((await db.logs.get(2))?.rating, 4.5);
  assert.equal((await db.logs.get(2))?.playSessions?.[0].durationMinutes, 60);
  assert.equal((await db.tags.get("favorite"))?.name, "Favorite");
  assert.deepEqual((await db.lists.get("ranked"))?.gameIds, [1, 2, 3]);
  assert.equal(await db.removals.get(id), undefined);
});
test("a failed recovery snapshot aborts removal without losing any data", async () => {
  const fail = () => {
    throw new Error("Storage unavailable");
  };
  db.removals.hook("creating", fail);
  try {
    await assert.rejects(RecoveryRepo.removeGame(2), /Storage unavailable/);
  } finally {
    db.removals.hook("creating").unsubscribe(fail);
  }
  assert.ok(await db.games.get(2));
  assert.ok(await db.logs.get(2));
  assert.deepEqual((await db.lists.get("ranked"))?.gameIds, [1, 2, 3]);
  assert.equal(await db.removals.count(), 0);
});
test("restoration keeps newer list edits and refuses to overwrite a re-added personal log", async () => {
  const id = await RecoveryRepo.removeGame(2);
  assert.ok(id);
  await db.lists.update("ranked", { name: "Renamed", gameIds: [3, 1] });
  await RecoveryRepo.restore(id);
  assert.deepEqual((await db.lists.get("ranked"))?.gameIds, [2, 3, 1]);
  assert.equal((await db.lists.get("ranked"))?.name, "Renamed");
  const again = await RecoveryRepo.removeGame(2);
  assert.ok(again);
  await db.games.put(game(2));
  await db.logs.put({ ...log(2), notes: "Newer notes" });
  await assert.rejects(RecoveryRepo.restore(again), /current entry/);
  assert.equal((await db.logs.get(2))?.notes, "Newer notes");
  assert.ok(await db.removals.get(again));
});
for (const order of ["game-first", "list-first"] as const)
  test(`games and lists can be recovered in either dependency order: ${order}`, async () => {
    let gameId: string | undefined, listId: string | undefined;
    if (order === "game-first") {
      gameId = await RecoveryRepo.removeGame(2);
      listId = await RecoveryRepo.removeList("ranked");
      await RecoveryRepo.restore(gameId!);
      await RecoveryRepo.restore(listId!);
    } else {
      listId = await RecoveryRepo.removeList("ranked");
      gameId = await RecoveryRepo.removeGame(2);
      await RecoveryRepo.restore(listId!);
      assert.deepEqual((await db.lists.get("ranked"))?.gameIds, [1, 3]);
      await RecoveryRepo.restore(gameId!);
    }
    assert.deepEqual((await db.lists.get("ranked"))?.gameIds, [1, 2, 3]);
    assert.equal((await db.lists.get("ranked"))?.isRanked, true);
  });
test("removing a list entry leaves the library intact and can be restored after reopening the database", async () => {
  const id = await RecoveryRepo.removeListGame("ranked", 2);
  assert.ok(id);
  assert.ok(await db.games.get(2));
  assert.ok(await db.logs.get(2));
  db.close();
  await db.open();
  assert.ok(await db.removals.get(id));
  await RecoveryRepo.restore(id);
  assert.deepEqual((await db.lists.get("ranked"))?.gameIds, [1, 2, 3]);
  await RecoveryRepo.restore(id);
  assert.deepEqual((await db.lists.get("ranked"))?.gameIds, [1, 2, 3]);
});
test("backup import undo restores the old library and retains newer edits as another recovery point", async () => {
  const incoming = {
    version: 2,
    exported: new Date().toISOString(),
    games: [game(10)],
    logs: [{ ...log(10), tagIds: [] }],
    lists: [],
    tags: [],
  };
  const id = await BackupRepo.importBackup(JSON.stringify(incoming), "replace");
  await db.logs.update(10, { notes: "Edited after import" });
  await RecoveryRepo.restore(id);
  assert.equal((await db.logs.get(2))?.notes, "Keep these notes");
  assert.deepEqual((await db.lists.get("ranked"))?.gameIds, [1, 2, 3]);
  assert.equal(await db.games.get(10), undefined);
  const retained = (await db.removals.toArray()).find((entry) => entry.kind === "library");
  assert.ok(retained && retained.kind === "library");
  assert.equal(retained.logs[0].notes, "Edited after import");
});
test("bulk-import undo recovers overwritten playtime without an external request", async () => {
  await db.logs.update(2, { timePlayed: 12 });
  const id = await GamesRepo.bulkImport([game(2)], [{ ...log(2), timePlayed: 30 }], true);
  assert.ok(id);
  assert.equal((await db.logs.get(2))?.timePlayed, 30);
  await RecoveryRepo.restore(id);
  assert.equal((await db.logs.get(2))?.timePlayed, 12);
});

test("discarding a recovery copy does not change the current library", async () => {
  const id = await RecoveryRepo.removeListGame("ranked", 2);
  assert.ok(id);
  await RecoveryRepo.forget(id);
  assert.equal(await db.removals.get(id), undefined);
  assert.equal((await db.logs.get(2))?.notes, "Keep these notes");
  assert.deepEqual((await db.lists.get("ranked"))?.gameIds, [1, 3]);
});

test("full-library snapshots retain only the latest ten and preserve individual recovery items", async () => {
  const removed = await RecoveryRepo.removeListGame("ranked", 2);
  for (let index = 0; index < 10; index++) {
    const id = await RecoveryRepo.captureLibrary("Import " + index);
    await db.removals.update(id, { removedAt: index });
  }
  const latest = await RecoveryRepo.captureLibrary("Latest import");
  const entries = await db.removals.where("kind").equals("library").toArray();
  assert.equal(entries.length, 10);
  assert.ok(entries.some((entry) => entry.id === latest));
  assert.ok(!entries.some((entry) => entry.label === "Import 0"));
  assert.ok(removed && (await db.removals.get(removed)));
});

test("play timer saves a dated session once and leaves manually recorded hours intact", async () => {
  await db.logs.update(2, { status: "Playing", timePlayed: 12 });
  assert.equal(await startPlayTimer(), "Game 2");
  await assert.rejects(() => startPlayTimer(1), /already running/);
  const start = new Date(2026, 10, 1, 12).getTime();
  const now = Date.now;
  Date.now = () => start + 25 * 60000;
  try {
    await db.playTimer.update("active", { startedAt: start });
    assert.deepEqual(await stopPlayTimer(), { title: "Game 2", minutes: 25 });
  } finally {
    Date.now = now;
  }
  await assert.rejects(() => stopPlayTimer(), /No play timer/);
  const saved = await db.logs.get(2);
  assert.deepEqual(saved?.playSessions?.at(-1), {
    date: localDate(new Date(start)),
    durationMinutes: 25,
  });
  assert.equal(saved?.timePlayed, 12);
});

test("upgrading an existing library prunes old snapshots and preserves removed items", async () => {
  const removed = await RecoveryRepo.removeListGame("ranked", 2);
  assert.ok(removed);
  const item = await db.removals.get(removed);
  assert.ok(item);
  await db.delete();
  const old = new Dexie("gamelog");
  old.version(4).stores({
    games: "igdbId, title, releaseYear, addedAt, updatedAt",
    logs: "igdbId, status, finishedAt, updatedAt, *tagIds",
    lists: "id, name, createdAt, updatedAt",
    tags: "id, name, createdAt, updatedAt",
    removals: "id, kind, removedAt",
  });
  try {
    await old.table("removals").bulkAdd([
      item,
      ...Array.from({ length: 12 }, (_, index) => ({
        id: "legacy-" + index,
        kind: "library",
        removedAt: index,
        label: "Legacy import",
        games: [],
        logs: [],
        lists: [],
        tags: [],
      })),
    ]);
  } finally {
    old.close();
  }
  await db.open();
  assert.equal(await db.removals.where("kind").equals("library").count(), 10);
  assert.equal(await db.removals.get("legacy-1"), undefined);
  assert.ok(await db.removals.get("legacy-2"));
  assert.deepEqual(await db.removals.get(removed), item);
});
