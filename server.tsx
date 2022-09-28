import { serve } from "https://deno.land/std@0.153.0/http/server.ts";
import { handler } from "./lib/handler.ts";
import { routes } from "./manifest.ts";
import { init } from './lib/init.ts'
import { resolve } from "https://deno.land/std@0.153.0/path/mod.ts";

await init({
  routes,
  importMaps: resolve('./importMap.json'),
});

// deno-lint-ignore require-await
serve(handler(async (req: Request) => {
  return new Response("Not found", {
    status: 404,
  });
}));
