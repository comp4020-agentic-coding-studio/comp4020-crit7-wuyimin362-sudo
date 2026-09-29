import { JSDOM } from "jsdom";
import { describe, expect, inject, it } from "vitest";
import { ROUTES } from "./routes";

// The deploy's link check only runs in CI once the repo is public, which is
// too late to find out. This is the same check, locally: every same-origin
// link, image, stylesheet and script on each route has to load.
const baseUrl = inject("baseUrl");

describe("internal links and assets", () => {
  for (const route of ROUTES) {
    it(`everything ${route} references loads`, async () => {
      const page = new URL(route, baseUrl);
      const doc = new JSDOM(await (await fetch(page)).text()).window.document;
      const refs = [...doc.querySelectorAll("a[href], img[src], link[href], script[src]")]
        .map((el) => new URL(el.getAttribute("href") ?? el.getAttribute("src") ?? "", page))
        .filter((url) => url.origin === page.origin)
        .map(String);
      for (const url of new Set(refs)) {
        expect((await fetch(url)).status, url).toBe(200);
      }
    });
  }
});
