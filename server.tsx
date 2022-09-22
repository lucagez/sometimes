import { serve } from "https://deno.land/std@0.153.0/http/server.ts";
import { ssr } from "./lib/ssr.tsx";
import { handler } from "./lib/handler.ts";
import { match } from "./lib/router.ts";
// import { glob } from "https://deno.land/std@0.153.0/path/glob.ts";
import { walk, WalkEntry } from "https://deno.land/std@0.153.0/fs/walk.ts";
import { common, extname } from "https://deno.land/std@0.153.0/path/mod.ts";
import { mutations } from "./lib/server.tsx";

declare global {
  let BUNDLER: boolean;

  interface Window {
    BUNDLER: boolean;
  }
}

const BASE_PATH = "src";
const entries: Array<WalkEntry & { pattern: string; isLayout: boolean }> = [];
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
  });
}

console.log(entries);

serve(handler(async (req: Request) => {
  // TODO: there's a bug:
  // mutations are registered only after first render
  // and stay in memory after. If the runtime is recycled while
  // the render already happened, there's going to be no mutation
  // listening. Should fix (:
  // 👉 console.log(mutations)
  // POTENTIAL SOLUTION: Should anyway implement
  // csrf tokens. So, no idea how this can change stuff but it should

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
        .map((layout) => "./" + layout.path);

      return new Response(await ssr(req, "./" + entry.path, layouts));
    }
  }

  if (req.method === "POST" && req.url.includes("/actions")) {
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
