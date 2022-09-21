import { serve } from "https://deno.land/std@0.153.0/http/server.ts";
import { ssr } from "./lib/ssr.tsx";
import { handler } from "./lib/handler.ts";
import { match } from "./lib/router.ts";
// import { glob } from "https://deno.land/std@0.153.0/path/glob.ts";
import { walk, WalkEntry } from "https://deno.land/std@0.153.0/fs/walk.ts";
import { common, extname } from "https://deno.land/std@0.153.0/path/mod.ts";

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

      console.log(layouts);

      return new Response(await ssr(req, "./" + entry.path, layouts));
    }
  }

  return new Response("Not found", {
    status: 404,
  });
}));
