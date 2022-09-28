import { walk, WalkEntry } from "https://deno.land/std@0.153.0/fs/walk.ts";
import { extname } from "https://deno.land/std@0.153.0/path/mod.ts";

export const entries: Array<
  WalkEntry & { pattern: string; isLayout: boolean; module: React.FC }
> = [];

export let importMap: any

type Config = {
  routes: Record<string, React.FC>
  importMaps: string
}

export const init = async (config: Config) => {
  importMap = JSON.parse(
    new TextDecoder().decode(await Deno.readFile(config.importMaps)),
  );

  for await (const entry of walk('src')) {
    const ext = extname(entry.path);

    if (!entry.isFile) continue;
    if (![".ts", ".tsx", ".js", ".jsx"].includes(ext)) continue;

    entries.push({
      ...entry,
      pattern: entry.path
        .replace('src', "")
        .replace(ext, "")
        // TODO: add index functionality
        .replaceAll("$", ":"),
      isLayout: entry.name.startsWith("_layout"),
      module: config.routes[entry.path],
    });
  }
}