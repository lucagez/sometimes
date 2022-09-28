import { extname, join } from "https://deno.land/std@0.153.0/path/mod.ts";
import { transformSourceSWC } from "./compiler.ts";
import { ssr } from "./ssr.tsx";
import { match } from "./router.ts";
import { mutations } from "./server.tsx";
import { entries } from './init.ts'

export const handler = (
  exec: (req: Request) => Response | Promise<Response>,
) => {
  return async (req: Request) => {
    const pathname = new URL(req.url).pathname;
    const file = join(Deno.cwd(), pathname);

    // TODO: Should strip out server code from components
    if (
      [".ts", ".tsx", ".js", ".jsx"].includes(extname(pathname)) &&
      !req.url.includes("/actions/") &&
      // TODO: improve whitelist
      (req.url.includes("/" + 'src' + "/") || req.url.includes("/lib/"))
    ) {
      const source = new TextDecoder().decode(await Deno.readFile(file));
      const { code } = await transformSourceSWC(source);
      return new Response(code, {
        headers: {
          "content-type": "text/javascript; charset=utf-8",
        },
      });
    }

    for (const entry of entries) {
      const params = match(entry.pattern).test(req);

      if (params) {
        const layouts = entries
          .filter((entry) => entry.isLayout)
          .sort((a, b) => a.path < b.path ? -1 : 1)
          .filter((layout) => {
            return entry.pattern
              .includes(layout.pattern.replace("_layout", ""));
          });

        return new Response(await ssr(req, entry, layouts));
      }
    }

    if (req.method === "POST" && req.url.includes("/actions/")) {
      for (const mutation of mutations) {
        if (!req.url.endsWith(mutation.path)) continue;

        const referer = req.headers.get("referer");

        if (!referer) {
          return new Response("Not Found", {
            status: 404,
          });
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

    return exec(req);
  };
};
