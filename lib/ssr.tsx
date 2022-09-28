/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { renderToReadableStream } from "react-dom/server";
import { RequestCtx } from "./server.tsx";
import * as React from "react";
import { transformSourceSWC } from "./compiler.ts";
import { WalkEntry } from "https://deno.land/std@0.153.0/fs/walk.ts";
import { Shit } from "./shit.tsx";
import { importMap } from './init.ts'

type Entry = WalkEntry & {
  pattern: string;
  isLayout: boolean;
  module: React.FC;
};

export async function ssr(req: Request, entry: Entry, layouts: Entry[]) {
  const Component = entry.module;

  const { code } = await transformSourceSWC(`
    window.BASE_PATH = '${'src'}';

    import { hydrateRoot } from "react-dom/client";
    import * as React from "react";
    import { Shit } from './lib/shit.tsx';
    import App from '${"./" + entry.path}';
    ${
    layouts.map((layout, i) =>
      `import Layout${i} from '${"./" + layout.path}';`
    ).join("\n")
  }

    const WithLayout = Shit(App, [${
    layouts.map((_, i) => `Layout${i}`).join(", ")
  }])

    hydrateRoot(document.querySelector("#root"), <WithLayout />);
  `);

  const WithLayouts = Shit(Component, layouts.map((x) => x.module));

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

        {/* TODO: There should be ability to add global styles (hooks for head / scripts) */}
        <script src="https://cdn.tailwindcss.com"></script>

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
    await stream.allReady;
  }

  return stream;
}
