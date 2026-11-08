import type { Status, Completion } from "../../types";

// ─── Status → color mapping ───────────────────────────────────────────────────
// Status and Completion are distinct taxonomies (see types/index.ts) — they get
// their own color maps so each value stays visually distinguishable.

export const STATUS_COLORS: Record<Status, string> = {
  Wishlist: "var(--app-pink)",
  Backlog: "var(--app-blue)",
  Playing: "var(--app-green)",
  Played: "var(--app-orange)",
};

export const STATUS_SUBTLE: Record<Status, string> = {
  Wishlist: "var(--app-pink-subtle)",
  Backlog: "var(--app-blue-subtle)",
  Playing: "var(--app-green-subtle)",
  Played: "var(--app-orange-subtle)",
};

// ─── Completion → color mapping ───────────────────────────────────────────────

export const COMPLETION_COLORS: Record<Completion, string> = {
  Completed: "var(--app-green)",
  Mastered: "var(--app-yellow)",
  Abandoned: "var(--app-red)",
  Shelved: "var(--app-purple)",
};

export const COMPLETION_SUBTLE: Record<Completion, string> = {
  Completed: "var(--app-green-subtle)",
  Mastered: "var(--app-yellow-subtle)",
  Abandoned: "var(--app-red-subtle)",
  Shelved: "var(--app-purple-subtle)",
};
