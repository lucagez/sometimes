import { renderToReadableStream } from "react-dom/server";
import { RequestCtx } from './server.tsx'
import * as React from 'react'

export async function ssr(req: Request, Component: React.ReactNode) {
  const importMap = JSON.parse(
    new TextDecoder().decode(await Deno.readFile("./importMap.json")),
  )

  const stream = await renderToReadableStream(
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Ultra</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
        <script async type="module" src="./client.tsx"></script>
      </head>
      <body>
        <div id="root">
          <RequestCtx.Provider value={req}>
            {Component}
          </RequestCtx.Provider>
        </div>
      </body>
    </html>
  );

  // await stream.allReady;
  // console.log('ready')

  return stream
}