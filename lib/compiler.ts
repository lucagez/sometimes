import * as esbuild from "esbuild";

// TODO: Transform source should strip out server code
export async function transformSource(
  source: string,
  development = true,
): Promise<{ code: string; map?: string }> {
  const withoutLoaders = source.replaceAll('export const loader', 'var _')
  const withoutServerImports = withoutLoaders.split('\n').filter(line => !line.includes('/server/')).join('\n')
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

// const file = await cache(
//   "https://esm.sh/@swc/wasm-web@1.3.0/wasm-web_bg.wasm",
// );

// await init(toFileUrl(file.path));

// // TODO: Transform source should strip out server code
// export async function transformSource(
//   source: string,
//   development = true,
// ): Promise<{ code: string; map?: string }> {
//   const replaced = source.replaceAll('__BUNDLER__', 'true')
//   const transformed = await transform(replaced, {
//     jsc: {
//       target: "es2022",
//       parser: {
//         syntax: "typescript",
//         dynamicImport: true,
//         tsx: true,
//       },
//       externalHelpers: true,
//       transform: {
//         react: {
//           useBuiltins: true,
//           importSource: "react",
//           runtime: "automatic",
//           development,
//           // TODO: investigate
//           refresh: false,
//         },
//       },
//     },
//     sourceMaps: !development,
//     inlineSourcesContent: true,
//     // minify: !development,
//     minify: true,
//   });

//   if (!transformed.code.includes("/** @jsx")) {
//     transformed.code = addJsxPragmas(transformed.code);
//   }

//   return transformed;
// }
