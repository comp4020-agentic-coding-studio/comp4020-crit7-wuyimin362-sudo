# Free Hour — the rules for this repo

Free Hour books ANU Sport's free weekly student court hour online: the slice
of a real ANU system this crit 7 prototype replaces. The brief and the fixed
spec are on the course site (crits/07-anu-system); `README.md` says what good
means here. This file is the rules the agent works under.

## The database is the only source of truth

- All state lives in SQLite through Drizzle. Nothing that has to survive a
  reload or a machine stop lives in memory: Fly stops idle machines.
- To change the schema: edit `src/lib/schema.ts`, run `pnpm db:generate`, and
  commit the migration in the same commit as the code that needs it.
  Migrations are append-only. Never edit or regenerate a committed one.
- A rule that can be a constraint is a constraint: one booking per court
  slot, one free hour per student per week. Name every unique index.
- The server re-validates every input. The form's `required` and `pattern`
  are for the person filling it in, not checks.

## Canberra time

- Read the clock only through `src/lib/time.ts`. A slot is a Canberra
  wall-clock `date` (YYYY-MM-DD) plus an `hour`. Never compare against the
  server's local time: Fly runs in UTC, and Canberra moves to daylight saving
  on 4 October.

## Works without JavaScript, and accessibly

- Every flow is a form POST answered with a 303 redirect. Client-side
  JavaScript only enhances it, e.g. live updates over `/api/events`.
- `spec/invariants.test.ts` stays green. A new page gets its route added to
  `spec/routes.ts`.
- Controls carry their full meaning in visible or visually-hidden text, not
  in an `aria-label` that says something different.

## Process

- `pnpm check` is green before every commit. The one exception is a commit
  that adds tests ahead of their implementation; its message says it is red.
- Small commits, one concern each, with a message that says why.
- When the same mistake happens twice, add a test for it instead of
  prompting again.

## Never

- Commit a secret (`mise.local.toml` holds the Fly token), or bypass the
  pre-commit hook.
- Change `fly.toml`'s machine, volume or auto-stop settings, the
  `Dockerfile`, or the CI workflow. `/api/events` must keep streaming,
  because the deploy checks probe it.
- Render a uni ID on any page or put one in a cookie. The device cookie is a
  random token.
- Remove the footer line saying this is a student prototype, not an ANU
  Sport service.
