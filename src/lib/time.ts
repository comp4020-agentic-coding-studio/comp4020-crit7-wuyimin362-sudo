// Canberra wall-clock time. A slot is a local date (YYYY-MM-DD) plus an hour,
// and every comparison happens in those terms: the server runs in UTC, and
// Canberra moves between AEST and AEDT.
export const TIME_ZONE = "Australia/Canberra";
export const DAYS_AHEAD = 7;
const FIRST_HOUR = 6;
const HOLIDAY_FIRST_HOUR = 9;
// the 13:00–14:00 slot: the free hour ends at 2pm
const LAST_HOUR = 13;

// The free hour runs on public holidays too, but ANU Sport opens at 9am on
// them. ACT public holidays for the rest of 2026.
const PUBLIC_HOLIDAYS: Record<string, string> = {
  "2026-10-05": "Labour Day",
  "2026-12-25": "Christmas Day",
  "2026-12-28": "Boxing Day",
};

export interface Now {
  date: string;
  hour: number;
  minute: number;
}

const clock = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function canberraNow(at: Date = new Date()): Now {
  const part = Object.fromEntries(clock.formatToParts(at).map((p) => [p.type, p.value]));
  return {
    date: `${part.year}-${part.month}-${part.day}`,
    hour: Number(part.hour),
    minute: Number(part.minute),
  };
}

const utcMidnight = (date: string): Date => new Date(`${date}T00:00:00Z`);

export function isDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) && utcMidnight(value).toISOString().startsWith(value)
  );
}

export function addDays(date: string, days: number): string {
  const d = utcMidnight(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// 1 = Monday … 7 = Sunday
export function weekday(date: string): number {
  return utcMidnight(date).getUTCDay() || 7;
}

export function isoWeek(date: string): string {
  // an ISO week belongs to the year its Thursday falls in
  const thursday = utcMidnight(addDays(date, 4 - weekday(date)));
  const year = thursday.getUTCFullYear();
  const dayOfYear = (thursday.getTime() - Date.UTC(year, 0, 1)) / 86_400_000 + 1;
  return `${year}-W${String(Math.ceil(dayOfYear / 7)).padStart(2, "0")}`;
}

export const holidayName = (date: string): string | undefined => PUBLIC_HOLIDAYS[date];

export function hoursOf(date: string): number[] {
  const first = holidayName(date) ? HOLIDAY_FIRST_HOUR : FIRST_HOUR;
  return Array.from({ length: LAST_HOUR - first + 1 }, (_, i) => first + i);
}

export function hasStarted(date: string, hour: number, now: Now): boolean {
  return date < now.date || (date === now.date && hour <= now.hour);
}

export function isBookable(date: string, hour: number, now: Now): boolean {
  return (
    weekday(date) <= 5 &&
    hoursOf(date).includes(hour) &&
    date <= addDays(now.date, DAYS_AHEAD) &&
    !hasStarted(date, hour, now)
  );
}

// the days with at least one slot still open, soonest first
export function bookableDays(now: Now): string[] {
  return Array.from({ length: DAYS_AHEAD + 1 }, (_, i) => addDays(now.date, i)).filter((date) =>
    hoursOf(date).some((hour) => isBookable(date, hour, now)),
  );
}

export const hourLabel = (hour: number): string => `${String(hour).padStart(2, "0")}:00`;

export const slotLabel = (hour: number): string => `${hourLabel(hour)}–${hourLabel(hour + 1)}`;

const dayFormat = new Intl.DateTimeFormat("en-AU", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
  month: "short",
});

export const dayLabel = (date: string): string => dayFormat.format(utcMidnight(date));
