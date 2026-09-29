import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { TestProject } from "vitest/node";
import { startServer } from "./server";

declare module "vitest" {
  export interface ProvidedContext {
    baseUrl: string;
  }
}

// Boot the BUILT server (the same artefact the Dockerfile runs) on a free
// port with a throwaway database, so the spec asserts what actually ships —
// not the dev server, and never your local data.
export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const server = await startServer({
    dbPath: join(mkdtempSync(join(tmpdir(), "spec-db-")), "test.db"),
  });
  project.provide("baseUrl", server.baseUrl);
  return server.stop;
}
