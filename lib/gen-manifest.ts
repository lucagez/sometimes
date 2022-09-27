import { walk } from "https://deno.land/std@0.156.0/fs/walk.ts";

for await (const entry of walk("./src")) {
  console.log(entry.path);
}