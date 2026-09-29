import type { APIRoute } from "astro";
import { cancel, isDevice, slotKey } from "../../../lib/bookings";
import { bus, type SlotChange } from "../../../lib/events";
import { canberraNow } from "../../../lib/time";

// Only the device that made a booking can cancel it, and only before it
// starts. Cancelling frees the slot and every player's hour for that week.
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const id = Number((await request.formData()).get("id"));
  const device = cookies.get("device")?.value;
  const freed = Number.isInteger(id) && isDevice(device) ? cancel(id, device, canberraNow()) : null;
  if (!freed) return redirect("/?error=not-cancelled", 303);

  bus.emit("slot", { slot: slotKey(freed), taken: false } satisfies SlotChange);
  return redirect(`/?day=${freed.date}&status=cancelled`, 303);
};
