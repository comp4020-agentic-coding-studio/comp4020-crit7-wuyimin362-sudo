import type { APIRoute } from "astro";
import { book, isDevice, readBookingForm, slotKey } from "../../../lib/bookings";
import { bus, type SlotChange } from "../../../lib/events";
import { canberraNow } from "../../../lib/time";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

// The booking form posts here. Every field is re-checked, the database has
// the final say, and the 303 lands back on the same day with the outcome, so
// the form works with no client-side JavaScript at all.
export const POST: APIRoute = async ({ request, cookies, redirect, url }) => {
  const form = await request.formData();
  const booking = readBookingForm(form);
  if (!booking) return redirect("/?error=invalid", 303);

  const { slot, players } = booking;
  const back = (outcome: string) => redirect(`/?day=${slot.date}&${outcome}`, 303);

  const existing = cookies.get("device")?.value;
  const device = isDevice(existing) ? existing : crypto.randomUUID();
  const result = book(slot, players, device, canberraNow());
  if (!result.ok) return back(`error=${result.error}`);

  // Path "/" matters: without it the cookie would be scoped to /api/bookings
  // and the booking page would never see it.
  cookies.set("device", device, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    maxAge: THIRTY_DAYS,
  });
  bus.emit("slot", { slot: slotKey(slot), taken: true } satisfies SlotChange);
  return back("status=booked");
};
