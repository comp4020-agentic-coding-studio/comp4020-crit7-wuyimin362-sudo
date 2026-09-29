import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { type AddressInfo, createServer } from "node:net";

const ENTRY = "./dist/server/entry.mjs";

export interface RunningServer {
  baseUrl: string;
  stop: () => Promise<void>;
}

function freePort(): Promise<number> {
  return new Promise((resolve) => {
    const probe = createServer();
    probe.listen(0, () => {
      const { port } = probe.address() as AddressInfo;
      probe.close(() => resolve(port));
    });
  });
}

// Boots the BUILT server (the artefact the Dockerfile runs) on a free port
// against the given SQLite file, and resolves once it answers.
export async function startServer({ dbPath }: { dbPath: string }): Promise<RunningServer> {
  if (!existsSync(ENTRY)) {
    throw new Error(`${ENTRY} not found — run \`pnpm test\`, which builds first`);
  }

  const port = await freePort();
  // Run it the way the Dockerfile does. pnpm's bin shims give the test
  // process a NODE_PATH into node_modules/.pnpm, and inheriting it lets the
  // server resolve packages production can't (sharp, for one).
  const env: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: "production" };
  delete env.NODE_PATH;
  const child = spawn("node", [ENTRY], {
    env: { ...env, HOST: "127.0.0.1", PORT: String(port), DATABASE_PATH: dbPath },
    stdio: "ignore",
  });

  // resolves only once the process has exited, so a restart can reopen the
  // same database file safely
  const stop = (): Promise<void> =>
    new Promise((resolve) => {
      if (child.exitCode !== null || child.signalCode !== null) return resolve();
      child.once("exit", () => resolve());
      child.kill();
    });

  const baseUrl = `http://127.0.0.1:${port}`;
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(baseUrl);
      if (res.ok) break;
    } catch {
      // not up yet
    }
    if (attempt >= 50) {
      await stop();
      throw new Error(`server did not come up at ${baseUrl}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return { baseUrl, stop };
}
