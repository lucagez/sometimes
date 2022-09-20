import { serve } from "https://deno.land/std@0.153.0/http/server.ts";
import App from "./src/app.tsx";
import { ssr } from "./lib/ssr.tsx";
import { handler } from './lib/handler.ts'

declare global {
  let BUNDLER: boolean;

  interface Window {
    BUNDLER: boolean;
  }
}

serve(handler(async (req: Request) => {
  return new Response(await ssr(req, <App />));
}));
