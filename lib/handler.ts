import { extname, join } from "https://deno.land/std@0.153.0/path/mod.ts";
import { transformSource } from "./compiler.ts";

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
      (req.url.includes("/" + BASE_PATH + "/") || req.url.includes("/lib/"))
    ) {
      const source = new TextDecoder().decode(await Deno.readFile(file));
      const { code } = await transformSource(source);
      return new Response(code, {
        headers: {
          "content-type": "text/javascript; charset=utf-8",
        },
      });
    }

    return exec(req);
  };
};
