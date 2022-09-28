/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
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
    suspended: { read: () => T | null };
    id: string;
    render: (
      state: T,
      result?: K,
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
  }
  if (typeof window !== "undefined" && !window["Deno"]) {
    const rawMutation = document.querySelector<HTMLElement>(
      `[id='__mutation_result_${id}']`,
    )
      ?.innerText;
    mutationResult = rawMutation && JSON.parse(rawMutation);

    const rawErrors = document.querySelector<HTMLElement>(
      `[id='__mutation_errors_${id}']`,
    )
      ?.innerText;
    mutationErrors = rawErrors ? JSON.parse(rawErrors) : {};
  }

  // LOADER CASE
  let state;
  if (typeof window !== "undefined" && "Deno" in window) {
    state = suspended.read();
  }
  if (typeof window !== "undefined" && !window["Deno"]) {
    const raw = document.querySelector<HTMLElement>(`[id='${id}']`)?.innerText;
    state = raw ? JSON.parse(raw) : {};
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
      {render(state, mutationResult!, mutationErrors)}
    </>
  );
}

export const RequestCtx = createContext<Request | null>(null);

export function withServerState<T, K>(
  id: string,
  exec: (req: Request) => Promise<T>,
) {
  return (
    Component: React.FC<
      React.PropsWithChildren & {
        data: T;
        invalidate: (params?: URLSearchParams) => void;
        invalidating: boolean;
        result?: K;
        errors?: Record<string, string>;
        mutating: boolean;
        Form: React.FC<React.PropsWithChildren>;
      }
    >,
  ): React.FC<React.PropsWithChildren> =>
  ({ children }) => {
    const _id = isomorphicPath(id);
    const req = useContext(RequestCtx);
    const [invalidating, setInvalidating] = useState(false);
    const [mutating, setMutating] = useState(false);
    const suspended = _suspender(exec ? exec(req!) : Promise.resolve(null));
    const patchSerializedStates = (raw: string) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(raw, "text/html");
      const states = Array.from(doc.querySelectorAll(".__serialized-state"));
      const results = Array.from(
        doc.querySelectorAll(".__serialized-mutation-result"),
      );
      const errors = Array.from(
        doc.querySelectorAll(".__serialized-mutation-errors"),
      );

      for (const state of states) {
        const existingStateEl = document.querySelector(`[id='${state.id}']`);
        existingStateEl?.replaceWith(state);
      }

      for (const result of results) {
        const existingResultEl = document.querySelector(`[id='${result.id}']`);
        existingResultEl?.replaceWith(result);
      }

      for (const error of errors) {
        const existingErrorEl = document.querySelector(`[id='${error.id}']`);
        existingErrorEl?.replaceWith(error);
      }
    };

    const invalidate = async (params?: URLSearchParams) => {
      setInvalidating(true);

      const l = new URL(window.location.href);

      if (params) {
        params.forEach((value, key) => {
          l.searchParams.set(key, value);
        });

        window.history.pushState(
          {
            path: l.toString(),
          },
          "",
          l.toString(),
        );
      }
      l.searchParams.set("__state", "true");
      const raw = await fetch(l.toString()).then((res) => res.text());
      patchSerializedStates(raw);

      setInvalidating(false);
    };

    const Form: React.FC<React.PropsWithChildren> = (
      { children },
    ) => {
      const _id = "__form_" + isomorphicPath(id);

      const onSubmit = async (event: React.FormEvent) => {
        setMutating(true);
        event.preventDefault();

        const element = event.target as HTMLFormElement;
        const form = new FormData(element);
        const raw = await fetch(element.action, {
          method: "POST",
          redirect: "follow",
          body: form,
        }).then((res) => res.text());
        patchSerializedStates(raw);

        setMutating(false);
      };

      return (
        <form
          className="__form"
          id={_id}
          method="POST"
          action={`/actions/${isomorphicPath(id)}`}
          onSubmit={onSubmit}
        >
          {children}
        </form>
      );
    };

    return (
      <Suspense fallback={"⏳ loading..."}>
        <DeferredComponent<T, K>
          id={_id}
          suspended={suspended}
          render={(state, mutationResult, mutationErrors) => (
            <Component
              data={state!}
              children={children}
              invalidate={invalidate}
              invalidating={invalidating}
              result={mutationResult || undefined}
              errors={mutationErrors || undefined}
              Form={Form}
              mutating={mutating}
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
  exec: (
    req: Request,
  ) => Promise<{ result?: T; errors?: Record<string, string> }>,
) {
  mutations.push({
    path: isomorphicPath(id),
    mutation: exec,
  });
}
