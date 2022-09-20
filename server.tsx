import { serve } from "https://deno.land/std@0.153.0/http/server.ts";
import {
  extname,
  join,
} from "https://deno.land/std@0.153.0/path/mod.ts";
import { renderToReadableStream } from "react-dom/server";
import App, { RequestCtx } from "./src/app.tsx";
import { transformSource } from "./lib/compiler.ts";

declare global {
  var __BUNDLER__: boolean;

  interface Window {
    __BUNDLER__: boolean;
  }
}

serve(async (req: Request) => {
  const pathname = new URL(req.url).pathname;
  const file = join(".", pathname);

  // TODO: Should strip out server code from components
  if ([".ts", ".tsx", ".js", ".jsx"].includes(extname(pathname))) {
    const source = new TextDecoder().decode(await Deno.readFile(file));
    const { code } = await transformSource(source);
    return new Response(code, {
      headers: {
        "content-type": "text/javascript; charset=utf-8",
      },
    });
  }
  
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
            <App />
          </RequestCtx.Provider>
        </div>
      </body>
    </html>
  );

  // await stream.allReady;
  // console.log('ready')

  return new Response(stream);
});
