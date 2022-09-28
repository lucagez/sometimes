import { walk, WalkEntry } from "https://deno.land/std@0.153.0/fs/walk.ts";
import { extname } from "https://deno.land/std@0.153.0/path/mod.ts";

// TODO: read from args
let basePath = 'src'

const entries: Array<WalkEntry & { pattern: string; isLayout: boolean }> = [];
for await (const entry of walk(basePath)) {
  const ext = extname(entry.path);

  if (!entry.isFile) continue;
  if (![".ts", ".tsx", ".js", ".jsx"].includes(ext)) continue;

  entries.push({
    ...entry,
    pattern: entry.path
      .replace(basePath, "")
      .replace(ext, "")
      // TODO: add index functionality
      .replaceAll("$", ":"),
    isLayout: entry.name.startsWith("_layout"),
  });
}

let manifest = "const routes: Record<string, React.FC> = {};\n";
for (const [index, entry] of entries.entries()) {
  manifest += "\n";
  manifest += `import Route${index} from "${"./" + entry.path}";\n`;
  manifest += `routes["${entry.path}"] = Route${index};\n`;
}
manifest += "\nexport { routes };\n";

await Deno.writeTextFile("./manifest.ts", manifest);
