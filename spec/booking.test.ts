import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, inject, it } from "vitest";
import { startServer } from "./server";

// The booking page's contract, driven the way a browser drives it: read the
// page, submit its form, reload. Slots always come from the last day on
// offer, so none can start (and stop being bookable) mid-test.
const baseUrl = inject("baseUrl");

const newUid = (): string => `u${Math.floor(1_000_000 + Math.random() * 9_000_000)}`;

async function load(base: string, path = "/", cookie = ""): Promise<Document> {
  const res = await fetch(new URL(path, base), { headers: cookie ? { cookie } : {} });
  expect(res.status, `GET ${path}`).toBe(200);
  return new JSDOM(await res.text()).window.document;
}

async function lastDay(base: string): Promise<string> {
  const links = [...(await load(base)).querySelectorAll('a[href*="day="]')];
  expect(links.length, "the page offers no days to book").toBeGreaterThan(0);
  return links.at(-1)?.getAttribute("href") ?? "";
}

const slotButton = (doc: Document, slot: string) =>
  doc.querySelector<HTMLButtonElement>(`button[name="slot"][value="${slot}"]`);

const freeSlots = (doc: Document): string[] =>
  [...doc.querySelectorAll<HTMLButtonElement>('button[name="slot"]')]
    .filter((button) => !button.disabled)
    .map((button) => button.value);

const myBooking = (doc: Document, slot: string) =>
  doc.querySelector(`#my-booking [data-slot="${slot}"]`);

function bookingAction(doc: Document): string {
  const form = doc.querySelector('button[name="slot"]')?.closest("form");
  expect(form, "no booking form on the page").toBeTruthy();
  return form?.getAttribute("action") ?? "";
}

function post(
  base: string,
  path: string,
  fields: Record<string, string | string[]>,
  cookie = "",
): Promise<Response> {
  const body = new URLSearchParams();
  for (const [name, value] of Object.entries(fields)) {
    for (const v of [value].flat()) body.append(name, v);
  }
  return fetch(new URL(path, base), {
    method: "POST",
    headers: { origin: base, ...(cookie ? { cookie } : {}) },
    body,
    redirect: "manual",
  });
}

async function book(
  base: string,
  day: string,
  fields: Record<string, string | string[]>,
  cookie = "",
): Promise<Response> {
  return post(base, bookingAction(await load(base, day, cookie)), fields, cookie);
}

const cookieOf = (res: Response): string =>
  res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");

function expectBooked(res: Response): void {
  expect(res.status).toBe(303);
  expect(res.headers.get("location") ?? "").not.toMatch(/error=/);
}

function expectRefused(res: Response, reason: string): void {
  expect(res.status).toBe(303);
  expect(res.headers.get("location") ?? "").toContain(`error=${reason}`);
}

describe("booking the free student hour", () => {
  it("keeps a booking across a reload: taken for everyone, listed for the booker", async () => {
    const day = await lastDay(baseUrl);
    const page = await load(baseUrl, day);
    const [slot] = freeSlots(page);
    expect(slot, "no free slot on the last day").toBeTruthy();
    const student = newUid();

    const res = await post(baseUrl, bookingAction(page), { slot, uid: student });
    expectBooked(res);
    const setCookie = res.headers.getSetCookie().join("\n");
    expect(setCookie).toMatch(/Path=\//i);
    expect(setCookie).not.toContain(student);

    const anyone = await load(baseUrl, day);
    expect(slotButton(anyone, slot)?.disabled).toBe(true);
    expect(myBooking(anyone, slot)).toBeNull();

    const booker = await load(baseUrl, day, cookieOf(res));
    expect(myBooking(booker, slot)).not.toBeNull();
    expect(booker.documentElement.outerHTML).not.toContain(student);
  });

  it("refuses a second booking of a slot that is already taken", async () => {
    const day = await lastDay(baseUrl);
    const [slot] = freeSlots(await load(baseUrl, day));
    expectBooked(await book(baseUrl, day, { slot, uid: newUid() }));

    expectRefused(await book(baseUrl, day, { slot, uid: newUid() }), "slot-taken");
  });

  it("gives each student one free hour a week", async () => {
    const day = await lastDay(baseUrl);
    const [first, other] = freeSlots(await load(baseUrl, day));
    const student = newUid();
    expectBooked(await book(baseUrl, day, { slot: first, uid: student }));

    expectRefused(await book(baseUrl, day, { slot: other, uid: student }), "week-used");
    expect(slotButton(await load(baseUrl, day), other)?.disabled).toBe(false);
  });

  it("uses up the free hour of every listed player", async () => {
    const day = await lastDay(baseUrl);
    const [first, other] = freeSlots(await load(baseUrl, day));
    const partner = newUid();
    expectBooked(await book(baseUrl, day, { slot: first, uid: newUid(), partner }));

    expectRefused(await book(baseUrl, day, { slot: other, uid: partner }), "week-used");
  });

  it("lets only the booking device cancel, and gives back the slot and the hour", async () => {
    const day = await lastDay(baseUrl);
    const [first, other] = freeSlots(await load(baseUrl, day));
    const student = newUid();
    const booked = await book(baseUrl, day, { slot: first, uid: student });
    expectBooked(booked);
    const cookie = cookieOf(booked);

    const cancel = myBooking(await load(baseUrl, day, cookie), first)?.querySelector("form");
    expect(cancel, "no cancel form beside the booking").toBeTruthy();
    const action = cancel?.getAttribute("action") ?? "";
    const fields: Record<string, string> = {};
    for (const field of cancel?.querySelectorAll<HTMLInputElement | HTMLButtonElement>(
      "input[name], button[name]",
    ) ?? []) {
      fields[field.name] = field.value;
    }

    await post(baseUrl, action, fields, "device=someone-else");
    expect(slotButton(await load(baseUrl, day), first)?.disabled).toBe(true);

    expect((await post(baseUrl, action, fields, cookie)).status).toBe(303);
    expect(slotButton(await load(baseUrl, day), first)?.disabled).toBe(false);
    expectBooked(await book(baseUrl, day, { slot: other, uid: student }, cookie));
  });

  it("keeps bookings when the server restarts", async () => {
    const dbPath = join(mkdtempSync(join(tmpdir(), "spec-restart-")), "app.db");
    let server = await startServer({ dbPath });
    try {
      const day = await lastDay(server.baseUrl);
      const [slot] = freeSlots(await load(server.baseUrl, day));
      expectBooked(await book(server.baseUrl, day, { slot, uid: newUid() }));

      await server.stop();
      server = await startServer({ dbPath });
      expect(slotButton(await load(server.baseUrl, day), slot)?.disabled).toBe(true);
    } finally {
      await server.stop();
    }
  }, 20_000);
});

describe("what the deploy checks rely on", () => {
  it("renders / for a same-origin form POST and refuses a cross-site one", async () => {
    const probe = (origin: string) =>
      fetch(new URL("/", baseUrl), {
        method: "POST",
        headers: { origin, "content-type": "application/x-www-form-urlencoded" },
        body: "probe=1",
        redirect: "manual",
      });
    const same = await probe(baseUrl);
    expect(same.status).not.toBe(403);
    expect(same.status).toBeLessThan(500);
    expect((await probe("https://cross-site.example.com")).status).toBe(403);
  });

  it("announces a new booking on the live stream", async () => {
    const day = await lastDay(baseUrl);
    const [slot] = freeSlots(await load(baseUrl, day));

    const stream = await fetch(new URL("/api/events", baseUrl));
    expect(stream.headers.get("content-type")).toContain("text/event-stream");
    const reader = stream.body?.getReader();
    if (!reader) throw new Error("no response body");

    await book(baseUrl, day, { slot, uid: newUid() });

    const decoder = new TextDecoder();
    let received = "";
    while (!received.includes(slot)) {
      const { value, done } = await reader.read();
      if (done) throw new Error("stream ended before the booking was announced");
      received += decoder.decode(value, { stream: true });
    }
    await reader.cancel();
    expect(received).toContain("data: ");
  }, 10_000);
});
