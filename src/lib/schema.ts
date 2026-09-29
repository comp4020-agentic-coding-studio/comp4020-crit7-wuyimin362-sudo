import { sql } from "drizzle-orm";
import { check, int, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// The schema is the ground truth for the database. To change it: edit here,
// run `pnpm db:generate` to turn the diff into a migration under drizzle/,
// and commit both — the migration applies automatically when the server
// boots (see src/lib/db.ts), locally and deployed. Never edit the database
// by hand: state on the deployed volume outlives every deploy, and the
// migration trail is what keeps old state and new code compatible.
//
// The free hour's fixed rules live here as constraints; the ones that depend
// on the clock (not started yet, at most 7 days ahead, later opening on
// public holidays) are checked by the server in src/lib/bookings.ts.

// the courts, halls, nets and tennis courts the free hour covers, seeded by
// a migration
export const resources = sqliteTable("resources", {
  id: int().primaryKey(),
  venue: text().notNull(),
  name: text().notNull(),
  sports: text().notNull(),
});

export const bookings = sqliteTable(
  "bookings",
  {
    id: int().primaryKey({ autoIncrement: true }),
    resourceId: int("resource_id")
      .notNull()
      .references(() => resources.id),
    // a Canberra wall-clock slot: the hour from `hour`:00 to `hour + 1`:00
    date: text().notNull(),
    hour: int().notNull(),
    // the random device token of whoever booked it: only they may cancel
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    uniqueIndex("bookings_slot_uq").on(t.resourceId, t.date, t.hour),
    check("bookings_date_ck", sql`"date" IS date("date")`),
    check("bookings_weekday_ck", sql`strftime('%w', "date") NOT IN ('0', '6')`),
    check("bookings_hour_ck", sql`"hour" BETWEEN 6 AND 13`),
  ],
);

// everyone playing in a booking; each of them spends their free hour for the
// ISO week the booking falls in
export const bookingPlayers = sqliteTable(
  "booking_players",
  {
    bookingId: int("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    uniId: text("uni_id").notNull(),
    week: text().notNull(),
  },
  (t) => [
    uniqueIndex("players_week_uq").on(t.uniId, t.week),
    check("players_uni_id_ck", sql`"uni_id" GLOB 'u[0-9][0-9][0-9][0-9][0-9][0-9][0-9]'`),
  ],
);

export type Resource = typeof resources.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
