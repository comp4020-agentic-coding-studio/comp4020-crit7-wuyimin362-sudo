import { EventEmitter } from "node:events";

// One process, one bus: every open SSE connection subscribes here, and a
// booking or cancellation is broadcast to all of them. This only works
// because the app runs on exactly one machine (see fly.toml) — a second
// machine would have its own bus and clients would miss events.
export const bus = new EventEmitter();
bus.setMaxListeners(0);

// `slot` is the same "resourceId|date|hour" key the booking page's buttons
// carry, so a page can find the cell to update.
export interface SlotChange {
  slot: string;
  taken: boolean;
}
