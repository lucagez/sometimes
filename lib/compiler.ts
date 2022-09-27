// import * as esbuild from "https://deno.land/x/esbuild@v0.15.9/mod.js";
import * as esbuild from "https://deno.land/x/esbuild@v0.14.51/mod.js";
import { denoPlugin } from "https://deno.land/x/esbuild_deno_loader@0.5.2/mod.ts";

// TODO: Transform source should strip out server code
export async function transformSource(
  source: string,
  development = true,
): Promise<{ code: string; map?: string }> {
  const withoutLoaders = source.replaceAll("export const loader", "var _");
  const withoutServerImports = withoutLoaders.split("\n").filter((line) =>
    !line.includes("/server/")
  ).join("\n");
  // RIPARTIRE QUI! <-- Manifest works ok but mkdir does not on deploy ..
  // - refactor to use `build` 
  // - use denoPlugin
  // - bundle should be false anyway
  const transformed = await esbuild.transform(withoutServerImports, {
    define: {
      "BUNDLER": "true",
    },
    loader: "tsx",
    minifySyntax: true,
    treeShaking: true,
    minify: true,
  });

  if (!transformed.code.includes("/** @jsx")) {
    transformed.code = addJsxPragmas(transformed.code);
  }

  return transformed;
}

function addJsxPragmas(code: string) {
  return `/** @jsx React.createElement */\n/** @jsxFrag React.Fragment */\n${code}`;
}
