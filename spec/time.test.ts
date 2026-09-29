import { describe, expect, it } from "vitest";
import { canberraNow, isoWeek } from "../src/lib/time";

// The one implementation-level test: date logic is where this app can go
// quietly wrong, and Canberra changes to daylight saving on 4 October 2026.
describe("Canberra time", () => {
  it("numbers ISO weeks, including a 53-week year", () => {
    expect(isoWeek("2026-09-30")).toBe("2026-W40");
    expect(isoWeek("2026-12-31")).toBe("2026-W53");
    expect(isoWeek("2027-01-01")).toBe("2026-W53");
    expect(isoWeek("2027-01-04")).toBe("2027-W01");
  });

  it("reads the Canberra wall clock on both sides of the daylight-saving change", () => {
    expect(canberraNow(new Date("2026-10-02T01:30:00Z"))).toMatchObject({
      date: "2026-10-02",
      hour: 11,
    });
    expect(canberraNow(new Date("2026-10-05T01:30:00Z"))).toMatchObject({
      date: "2026-10-05",
      hour: 12,
    });
  });

  it("calls midnight hour 0 of the new day, not hour 24", () => {
    expect(canberraNow(new Date("2026-10-04T13:00:00Z"))).toMatchObject({
      date: "2026-10-05",
      hour: 0,
    });
  });
});
