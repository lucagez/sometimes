// import * as esbuild from "https://deno.land/x/esbuild@v0.15.9/mod.js";
// import * as esbuild from "https://deno.land/x/esbuild@v0.14.51/mod.js";
// import { denoPlugin } from "https://deno.land/x/esbuild_deno_loader@0.5.2/mod.ts";
import init, {
  transform,
} from "https://esm.sh/@swc/wasm-web@1.3.2/wasm-web.js";

// TODO: Transform source should strip out server code
// export async function transformSource(
//   source: string,
//   development = true,
// ): Promise<{ code: string; map?: string }> {
//   const withoutLoaders = source.replaceAll("export const loader", "var _");
//   const withoutServerImports = withoutLoaders.split("\n").filter((line) =>
//     !line.includes("/server/")
//   ).join("\n");
//   // RIPARTIRE QUI! <-- Manifest works ok but mkdir does not on deploy ..
//   // - refactor to use `build`
//   // - use denoPlugin
//   // - bundle should be false anyway
//   const transformed = await esbuild.transform(withoutServerImports, {
//     define: {
//       "BUNDLER": "true",
//     },
//     loader: "tsx",
//     minifySyntax: true,
//     treeShaking: true,
//     minify: true,
//   });

//   if (!transformed.code.includes("/** @jsx")) {
//     transformed.code = addJsxPragmas(transformed.code);
//   }

//   return transformed;
// }

function addJsxPragmas(code: string) {
  return `/** @jsx React.createElement */\n/** @jsxFrag React.Fragment */\n${code}`;
}

let file: Uint8Array;

try {
  file = await Deno.readFile("./wasm-web_bg.wasm");
} catch {
  console.log("[CACHE] downloading swc wasm");
  file = await fetch("https://esm.sh/@swc/wasm-web@1.3.2/wasm-web_bg.wasm")
    .then((res) => res.arrayBuffer()) as Uint8Array;
  await Deno.writeFile("./wasm-web_bg.wasm", file);
}

await init(file);

export async function transformSourceSWC(
  source: string,
  development = true,
): Promise<{ code: string; map?: string }> {
  const transformed = await transform(source, {
    jsc: {
      target: "es2022",
      parser: {
        syntax: "typescript",
        dynamicImport: true,
        tsx: true,
      },
      externalHelpers: true,
      transform: {
        react: {
          pragma: "React.createElement",
          pragmaFrag: "React.Fragment",
          useBuiltins: true,
          importSource: "react",
          runtime: "classic",
          development,
          refresh: false,
        },
      },
    },
    sourceMaps: !development ? true : undefined,
    inlineSourcesContent: true,
    minify: !development,
  });

  if (!transformed.code.includes("/** @jsx")) {
    transformed.code = addJsxPragmas(transformed.code);
  }

  return transformed;
}
