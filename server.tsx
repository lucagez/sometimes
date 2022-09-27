import { serve } from "https://deno.land/std@0.153.0/http/server.ts";
import { ssr } from "./lib/ssr.tsx";
import { handler } from "./lib/handler.ts";
import { match } from "./lib/router.ts";
import { walk, WalkEntry } from "https://deno.land/std@0.153.0/fs/walk.ts";
import { common, extname } from "https://deno.land/std@0.153.0/path/mod.ts";
import { mutations } from "./lib/server.tsx";
import { join } from "https://deno.land/std@0.153.0/path/win32.ts";
import { routes } from './manifest.ts'

declare global {
  let BUNDLER: boolean;
  let SECRET: string;
  let BASE_PATH: string;

  interface Window {
    BUNDLER: boolean;
    SECRET: string;
    BASE_PATH: string;
  }
}

window.BASE_PATH = "src";
window.SECRET = "change_me";

const entries: Array<WalkEntry & { pattern: string; isLayout: boolean; module: React.FC }> = [];
for await (const entry of walk(BASE_PATH)) {
  const ext = extname(entry.path);

  if (!entry.isFile) continue;
  if (![".ts", ".tsx", ".js", ".jsx"].includes(ext)) continue;

  entries.push({
    ...entry,
    pattern: entry.path
      .replace(BASE_PATH, "")
      .replace(ext, "")
      // TODO: add index functionality
      .replaceAll("$", ":"),
    isLayout: entry.name.startsWith("_layout"),
    module: routes[entry.path]
  });
}

serve(handler(async (req: Request) => {
  for (const entry of entries) {
    const params = match(entry.pattern).test(req);

    if (params) {
      const layouts = entries
        .filter((entry) => entry.isLayout)
        .sort((a, b) => a.path < b.path ? -1 : 1)
        .filter((layout) => {
          return entry.pattern
            .includes(layout.pattern.replace("_layout", ""));
        })

      return new Response(await ssr(req, entry, layouts));
    }
  }

  if (req.method === "POST" && req.url.includes("/actions/")) {
    // Preload mutation. This is cached no worries
    // PRELOADING MUTATIONS SHOULD NOT BE NEEDED
    // await import(
    //   req.url.replace(/.*\/actions\//, "./" + join(".", BASE_PATH) + "/")
    // );

    for (const mutation of mutations) {
      if (!req.url.endsWith(mutation.path)) continue;

      const referer = req.headers.get("referer");

      // TODO: what if?
      if (!referer) {
        throw new Error("What to do?");
      }

      // TODO: Should encrypt
      // TODO: Handle errors
      const result = await mutation.mutation(req);
      const encoded = btoa(JSON.stringify(result));
      const redirect = new URL(referer);
      redirect.searchParams.set("__mutation", encoded);

      return new Response(null, {
        status: 301,
        headers: {
          Location: redirect.pathname + redirect.search,
        },
      });
    }
  }

  return new Response("Not found", {
    status: 404,
  });
}));
