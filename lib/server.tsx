/// <reference lib="dom" />

import { createContext, Suspense, useContext, useState } from "react";
import * as React from "react";
import { isomorphicPath } from "./isomorphic-path.ts";

function _suspender<T>(exec: Promise<T>) {
  let status = "pending";
  let result: T;

  const suspender = exec.then(
    (r) => {
      status = "success";
      result = r;
    },
    (e) => {
      status = "error";
      result = e;
    },
  );

  return {
    read(): T {
      if (status === "pending") {
        throw suspender;
      }
      if (status === "error") {
        throw result;
      }
      if (status === "success") {
        return result;
      }
      // rendering of the component will never proceed
      return null!;
    },
  };
}

function DeferredComponent<T>(
  { suspended, id, render }: {
    suspended: { read: () => T };
    id: string;
    render: (result: T) => React.ReactElement;
  },
) {

  let state;
  if (typeof window !== "undefined" && "Deno" in window) {
    state = suspended.read();
  }
  if (typeof window !== "undefined" && !window["Deno"]) {
    // @ts-ignore: no you cannot use refs
    const raw = document.querySelector(`[id='${id}']`)?.innerText;
    state = raw ? JSON.parse(raw) : {};
    // state = JSON.parse(ref.current.innerText)
  }

  return (
    <>
      <script
        id={id}
        className="__serialized-state"
        type="application/json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(state) }}
      >
      </script>
      {render(state)}
    </>
  );
}

export const RequestCtx = createContext<Request | null>(null);

if (typeof BUNDLER === "undefined") {
  window.BUNDLER = false;
}

export function withServerState<T>(
  id: string,
  exec: (req: Request) => Promise<T>,
) {
  return (Component: React.FC<React.PropsWithChildren & { data: T, invalidate: () => void, invalidating: boolean }>) => ({ children }: any = { children: null }) => {
    const _id = isomorphicPath(id)
    const req = useContext(RequestCtx);
    const [, _rerender] = useState(Symbol())
    const [invalidating, setInvalidating] = useState(false)
    const suspended = _suspender(exec ? exec(req!) : Promise.resolve(null));

    const invalidate = async () => {
      setInvalidating(true)

      const l = new URL(window.location.href)
      l.searchParams.set('__state', 'true')
      const raw = await fetch(l.toString()).then(res => res.text()) 
      const parser = new DOMParser()
      const doc = parser.parseFromString(raw, 'text/html')
      const states = Array.from(doc.querySelectorAll('.__serialized-state'))

      for (const state of states) {
        const existingStateEl = document.querySelector(`[id='${state.id}']`)
        existingStateEl?.replaceWith(state)
      }

      // _rerender(Symbol())
      setInvalidating(false)
    }

    return (
      <Suspense fallback={"⏳ loading..."}>
        <DeferredComponent
          id={_id}
          suspended={suspended}
          render={(result) => <Component 
            data={result!} 
            children={children} 
            invalidate={invalidate} 
            invalidating={invalidating}
          />}
        />
      </Suspense>
    );
  };
}