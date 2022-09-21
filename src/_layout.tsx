import * as React from "react";
import { isomorphicPath } from "../lib/isomorphic-path.ts";
import { withServerState } from "../lib/server.tsx";
import { add } from '../server/some-func.ts'

let routes = ["/app", "/about/me", "/blog"]

// setInterval(() => {
//   routes.push('other-route')
// }, 1000)

// deno-lint-ignore require-await
const loader = withServerState(import.meta.url, async () => {
  return routes;
});

// TODO: in order to eliminate server code: 
// - Wrap everything in #SERVER comment.
// - replace loader with withServerState(import.meta.url, Promise.resolve(null))

// RIPARTIRE QUI!<--
// - guardare sopra ☝️
// - possibile implementare mutations grazie a consistent hashes. 
//   una mutation puo essere invocata coun form
//   👉 <form method="POST" action={/actions/isomorphicPath(id)}>
//   👉 if (method == 'POST' && url == isomorphicPath(id)) { ...execute action ... }
//   👉 register global handlers while executing hooks (only in Deno environment)
//   👉 const Form = withServerMutation(import.meta.url, () => ({ result, errors }))
//   👉 Form can catch and perform fetch request (questo fa arrabbiare la community. 
//      come implementare progressive enhancement??)

export default loader(({ children, data, invalidate, invalidating }) => {
  console.log('meta dashboard', isomorphicPath(import.meta.url), data)
  return (
    <div>
      <h1 onClick={invalidate}>This is a layout</h1>
      <nav>
        {invalidating && <p>Fetching new routes ...</p>}
        <ul>
          {data.map((x, i) => <li key={i}><a href={x}>{x}</a></li>)}
        </ul>
      </nav>
      <div>
        {children}
      </div>
    </div>
  );
})