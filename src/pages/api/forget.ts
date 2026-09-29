import type { APIRoute } from "astro";

// Drops the device cookie, so a shared computer stops showing (and letting
// the next person cancel) the booking made on it.
export const POST: APIRoute = ({ cookies, redirect }) => {
  cookies.delete("device", { path: "/" });
  return redirect("/?status=forgotten", 303);
};
