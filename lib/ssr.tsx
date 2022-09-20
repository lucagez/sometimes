import { renderToReadableStream } from "react-dom/server";
import { RequestCtx } from './server.tsx'
import * as React from 'react'
import { transformSource } from './compiler.ts'
import { join } from "https://deno.land/std@0.153.0/path/mod.ts";

export async function ssr(req: Request, path: string) {
  const importMap = JSON.parse(
    new TextDecoder().decode(await Deno.readFile("./importMap.json")),
  )
  const absolutePath = join(Deno.cwd(), path)
  const { default: Component } = await import(absolutePath)
  const { code } = await transformSource(`
    import { hydrateRoot } from "react-dom/client";
    import * as React from "react";
    import App from '${path}'

    hydrateRoot(document.querySelector("#root"), <App />);
  `);

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
        ></script>
      </head>
      <body>
        <div id="root">
          <RequestCtx.Provider value={req}>
            <Component />
          </RequestCtx.Provider>
        </div>
      </body>
    </html>
  );

  // await stream.allReady;
  // console.log('ready')

  return stream
}