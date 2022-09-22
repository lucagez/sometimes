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

function DeferredComponent<T, K>(
  { suspended, id, render }: {
    suspended: { read: () => T };
    id: string;
    render: (
      state: T,
      result: K,
      errors?: Record<string, string>,
    ) => React.ReactElement;
  },
) {
  let mutationResult: K;
  let mutationErrors = {} as Record<string, string>;

  // MUTATION CASE
  const req = useContext(RequestCtx);
  const url = req && new URL(req.url);
  const mutation = url?.searchParams.get("__mutation");
  if (req && mutation) {
    // TODO: Handle decryption + errors cases
    const { result, errors } = JSON.parse(atob(mutation)) || {};

    mutationErrors = errors;
    mutationResult = result;
    console.log("decoded state", { result, errors });
  }
  if (typeof window !== "undefined" && !window["Deno"]) {
    // @ts-ignore: TODO: fix -> no you cannot use refs
    const rawMutation = document.querySelector(`[id='__mutation_result_${id}']`)
      ?.innerText;
    mutationResult = rawMutation && JSON.parse(rawMutation);

    // @ts-gnore: TODO: fix
    const rawErrors = document.querySelector(`[id='__mutation_errors_${id}']`)
      ?.innerText;
    mutationErrors = rawErrors ? JSON.parse(rawErrors) : {};
  }

  // LOADER CASE
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
      <script
        id={"__mutation_result_" + id}
        className="__serialized-mutation-result"
        type="application/json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(mutationResult! || ""),
        }}
      >
      </script>
      <script
        id={"__mutation_errors_" + id}
        className="__serialized-mutation-errors"
        type="application/json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mutationErrors) }}
      >
      </script>
      {render(state, mutationResult, mutationErrors)}
    </>
  );
}

export const RequestCtx = createContext<Request | null>(null);

if (typeof BUNDLER === "undefined") {
  window.BUNDLER = false;
}

export function withServerState<T, K>(
  id: string,
  exec: (req: Request) => Promise<T>,
) {
  return (
    Component: React.FC<
      React.PropsWithChildren & {
        data: T;
        invalidate: () => void;
        invalidating: boolean;
        result: K;
        errors?: Record<string, string>;
      }
    >,
  ) =>
  ({ children }: any = { children: null }) => {
    const _id = isomorphicPath(id);
    const req = useContext(RequestCtx);
    const [, _rerender] = useState(Symbol());
    const [invalidating, setInvalidating] = useState(false);
    const suspended = _suspender(exec ? exec(req!) : Promise.resolve(null));

    const invalidate = async () => {
      setInvalidating(true);

      const l = new URL(window.location.href);
      l.searchParams.set("__state", "true");
      const raw = await fetch(l.toString()).then((res) => res.text());
      const parser = new DOMParser();
      const doc = parser.parseFromString(raw, "text/html");
      const states = Array.from(doc.querySelectorAll(".__serialized-state"));

      for (const state of states) {
        const existingStateEl = document.querySelector(`[id='${state.id}']`);
        existingStateEl?.replaceWith(state);
      }

      // _rerender(Symbol())
      setInvalidating(false);
    };

    return (
      <Suspense fallback={"⏳ loading..."}>
        <DeferredComponent
          id={_id}
          suspended={suspended}
          render={(state, mutationResult, mutationErrors) => (
            <Component
              data={state!}
              children={children}
              invalidate={invalidate}
              invalidating={invalidating}
              result={mutationResult as K}
              errors={mutationErrors}
            />
          )}
        />
      </Suspense>
    );
  };
}

type Mutation = {
  path: string;
  mutation: (req: Request) => Promise<any>;
};

export const mutations: Array<Mutation> = [];

// TODO: Create server / browser version for the same functions
// as this stuff should not run inside the browser
export function withServerMutation<T>(
  id: string,
  exec: (req: Request) => Promise<T>,
): React.FC<React.PropsWithChildren> {
  console.log("setting mutations");
  mutations.push({
    path: isomorphicPath(id),
    mutation: exec,
  });

  return ({ children }) => {
    const _id = "__form_" + isomorphicPath(id);
    // TODO: grab encrypted state from redirected request
    const req = useContext(RequestCtx);

    return (
      <form
        className="__form"
        id={_id}
        method="POST"
        action={`/actions/${isomorphicPath(id)}`}
      >
        {children}
      </form>
    );
  };
}
