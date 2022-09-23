import { renderToReadableStream } from "react-dom/server";
import { RequestCtx } from "./server.tsx";
import * as React from "react";
import { transformSource } from "./compiler.ts";
import { join } from "https://deno.land/std@0.153.0/path/mod.ts";
import { Shit } from "./shit.tsx";

type LayoutImport = {
  default: React.FC<React.PropsWithChildren>;
  loader: <T>(req: Request) => Promise<T>;
};

export async function ssr(req: Request, path: string, layouts: string[]) {
  const importMap = JSON.parse(
    new TextDecoder().decode(await Deno.readFile("./importMap.json")),
  );
  const absolutePath = join(Deno.cwd(), path);
  const { default: Component } = await import(absolutePath);
  const layoutImports: Array<LayoutImport> = await Promise.all(
    layouts.map(async (layout) => {
      const l = await import(join(Deno.cwd(), layout));
      return {
        default: l.default as unknown as React.FC<React.PropsWithChildren>,
        loader: l.loader || (() => ({})),
      };
    }),
  );

  const { code } = await transformSource(`
    window.BASE_PATH = '${BASE_PATH}';

    import { hydrateRoot } from "react-dom/client";
    import * as React from "react";
    import { Shit } from './lib/shit.tsx';
    import App from '${path}';
    ${
    layouts.map((layout, i) => `import Layout${i} from '${layout}';`).join("\n")
  }

    const WithLayout = Shit(App, [${
    layouts.map((_, i) => `Layout${i}`).join(", ")
  }])

    hydrateRoot(document.querySelector("#root"), <WithLayout />);
  `);

  const data = await Promise.all(layoutImports.map((x) => x.loader({} as any)));
  console.log({ data });

  const WithLayouts = Shit(Component, layoutImports.map((x) => x.default));

  const stream = await renderToReadableStream(
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Ultra</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <base href="/" />
        <script
          async
          src="https://ga.jspm.io/npm:es-module-shims@1.5.18/dist/es-module-shims.js"
        >
        </script>
        <script
          type="importmap"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(importMap) }}
        >
        </script>
        <script
          async
          type="module"
          dangerouslySetInnerHTML={{ __html: code }}
        >
        </script>
      </head>
      <body>
        <div id="root">
          <RequestCtx.Provider value={req}>
            <WithLayouts />
          </RequestCtx.Provider>
        </div>
      </body>
    </html>,
  );

  if (new URL(req.url).searchParams.get("__state")) {
    console.log("PRELOADING EVERYTHING! ‼🦊️");
    await stream.allReady;
  }

  return stream;
}
