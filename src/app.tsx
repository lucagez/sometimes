import { Suspense, useState, createContext, useContext, useRef } from "react";
import * as React from 'react'
import { resolveNum } from "../server/func.ts";

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
    }
  );

  return {
    read(): T {
      console.log('Read!', status)
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
      return null!
    },
  };
}

function DeferredComponent<T>({ suspended, id, render }: { suspended: { read: () => T }; id: string; render: (result: T) => React.ReactElement }) {
  const ref = useRef(null)

  let state
  if (typeof window !== 'undefined' && 'Deno' in window) {
    state = suspended.read()
  }
  if (typeof window !== 'undefined' && !window['Deno']) {
    // @ts-ignore: no you cannot use refs
    state = JSON.parse(document.querySelector('#'+id).innerText)
    // state = JSON.parse(ref.current.innerText)
  }

  return <>
    <script 
      id={id}
      ref={ref}
      type="application/json" 
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(state) }}
    ></script>
    {render(state)}
  </>
}

//@ts-ignore: ok
function Home({ data }) {
  console.log("Hello world!", data);
  const [count, setCount] = useState(data);
  return (
    <main>
      <h1>
        <span>{count}</span>__<span>{count}</span>
        <button onClick={() => setCount(count + 1)}>INCREMENT</button>
      </h1>
      <p>
        Welcome to{" "}
        <strong>Ultra</strong>. This is a barbones starter for your web
        app.
      </p>
    </main>
  );
}

export const RequestCtx = createContext<Request | null>(null)

if (typeof __BUNDLER__ === 'undefined') {
  globalThis.__BUNDLER__ = false
}

function withServerState<T>(id: string, exec: (req: Request) => Promise<T>) {
  return (Component: React.FC<{ data: T }>) => () => {
    const req = useContext(RequestCtx)

    let suspended;
    if (__BUNDLER__) {
      suspended = _suspender(Promise.resolve(null))
    } else {
      suspended = _suspender(exec(req!))
    }

    return (
      <Suspense fallback={'⏳ loading...'}>
        <DeferredComponent 
          id={id}
          suspended={suspended} 
          render={(result) => <Component data={result!} />}
        />
      </Suspense>
    )
  }
}

export default withServerState('bananas', resolveNum)(Home)