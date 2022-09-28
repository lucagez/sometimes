import init, {
  transform,
} from "https://esm.sh/@swc/wasm-web@1.3.2/wasm-web.js";

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
