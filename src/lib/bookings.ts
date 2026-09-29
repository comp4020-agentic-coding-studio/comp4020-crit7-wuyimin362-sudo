import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "./db";
import { bookingPlayers, bookings, type Resource, resources } from "./schema";
import { hasStarted, isBookable, isDate, isoWeek, type Now } from "./time";

export const MAX_PARTNERS = 3;
const UNI_ID = /^u\d{7}$/;
const DEVICE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface Slot {
  resourceId: number;
  date: string;
  hour: number;
}

// "resourceId|date|hour": the value a slot button submits
export const slotKey = (slot: Slot): string => `${slot.resourceId}|${slot.date}|${slot.hour}`;

export function parseSlot(key: string): Slot | null {
  const match = /^(\d+)\|(\d{4}-\d{2}-\d{2})\|(\d{1,2})$/.exec(key);
  if (!match || !isDate(match[2])) return null;
  return { resourceId: Number(match[1]), date: match[2], hour: Number(match[3]) };
}

export const isDevice = (value: string | undefined): value is string =>
  value !== undefined && DEVICE.test(value);

const normalise = (value: FormDataEntryValue | null): string =>
  String(value ?? "")
    .trim()
    .toLowerCase();

// The slot and everyone playing, from the booking form; null if any of it is
// malformed. The booker comes first; blank partner fields are ignored.
export function readBookingForm(form: FormData): { slot: Slot; players: string[] } | null {
  const slot = parseSlot(String(form.get("slot") ?? ""));
  const players = [
    normalise(form.get("uid")),
    ...form.getAll("partner").map(normalise).filter(Boolean),
  ];
  const valid =
    slot !== null &&
    players.length <= MAX_PARTNERS + 1 &&
    players.every((player) => UNI_ID.test(player)) &&
    new Set(players).size === players.length;
  return valid ? { slot, players } : null;
}

export const listResources = (): Resource[] =>
  db.select().from(resources).orderBy(resources.id).all();

export function takenOn(date: string): Set<string> {
  const rows = db
    .select({ resourceId: bookings.resourceId, date: bookings.date, hour: bookings.hour })
    .from(bookings)
    .where(eq(bookings.date, date))
    .all();
  return new Set(rows.map(slotKey));
}

export interface DeviceBooking {
  id: number;
  slot: Slot;
  venue: string;
  name: string;
  players: number;
  started: boolean;
}

// What this device has booked that hasn't finished yet. It says how many
// players, never who.
export function bookingsOf(device: string, now: Now): DeviceBooking[] {
  return db
    .select({
      id: bookings.id,
      resourceId: bookings.resourceId,
      date: bookings.date,
      hour: bookings.hour,
      venue: resources.venue,
      name: resources.name,
      players: sql<number>`count(${bookingPlayers.uniId})`,
    })
    .from(bookings)
    .innerJoin(resources, eq(resources.id, bookings.resourceId))
    .leftJoin(bookingPlayers, eq(bookingPlayers.bookingId, bookings.id))
    .where(and(eq(bookings.createdBy, device), gte(bookings.date, now.date)))
    .groupBy(bookings.id)
    .orderBy(bookings.date, bookings.hour)
    .all()
    .filter((row) => row.date > now.date || row.hour >= now.hour)
    .map(({ resourceId, date, hour, ...row }) => ({
      ...row,
      slot: { resourceId, date, hour },
      started: hasStarted(date, hour, now),
    }));
}

export type BookingError = "closed" | "slot-taken" | "week-used" | "invalid";

// The clock-dependent rules are checked here; the schema's constraints decide
// the rest, and a refusal from them becomes the matching reason.
export function book(
  slot: Slot,
  players: string[],
  device: string,
  now: Now,
): { ok: true } | { ok: false; error: BookingError } {
  if (!isBookable(slot.date, slot.hour, now)) return { ok: false, error: "closed" };
  const week = isoWeek(slot.date);
  try {
    db.transaction((tx) => {
      const { id } = tx
        .insert(bookings)
        .values({ ...slot, createdBy: device })
        .returning({ id: bookings.id })
        .get();
      tx.insert(bookingPlayers)
        .values(players.map((uniId) => ({ bookingId: id, uniId, week })))
        .run();
    });
    return { ok: true };
  } catch (thrown) {
    const error = ((thrown as { cause?: unknown }).cause ?? thrown) as {
      code?: string;
      message?: string;
    };
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      const players = error.message?.includes("booking_players.") ?? false;
      return { ok: false, error: players ? "week-used" : "slot-taken" };
    }
    if (error.code?.startsWith("SQLITE_CONSTRAINT")) return { ok: false, error: "invalid" };
    throw thrown;
  }
}

// Cancels a booking this device made, if it hasn't started, and returns the
// slot it frees.
export function cancel(id: number, device: string, now: Now): Slot | null {
  const row = db
    .select({ resourceId: bookings.resourceId, date: bookings.date, hour: bookings.hour })
    .from(bookings)
    .where(and(eq(bookings.id, id), eq(bookings.createdBy, device)))
    .get();
  if (!row || hasStarted(row.date, row.hour, now)) return null;
  db.delete(bookings).where(eq(bookings.id, id)).run();
  return row;
}
