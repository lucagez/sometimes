import * as React from "react";
import { isomorphicPath } from "../lib/isomorphic-path.ts";
import { withServerMutation, withServerState } from "../lib/server.tsx";
import { add } from "../server/some-func.ts";

let routes = ["/app", "/about/me", "/blog"];

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
// - refactor mutations
// - implement secure mutations
// - implement csrf tokens (evaluate?)
// - implement js mutations (with DOMParser)
// - refactor BASE_PATH!!!
// - refactor typings!!!

const Form = withServerMutation(import.meta.url, async (req: Request) => {
  const data = await req.formData()
  const email = data.get('email')

  if (!email?.toString().endsWith('@gmail.com')) {
    return {
      // result: "",
      errors: {
        email: 'Please provide an email ending with @gmail.com'
      },
    };
  }

  return {
    result: "success! registered email " + email,
    errors: {},
  };
});

export default loader(({ children, data, invalidate, invalidating, result, errors }) => {
  console.log("meta dashboard", isomorphicPath(import.meta.url), data);
  const mutationResult = result as any
  return (
    <div>
      <h1 onClick={invalidate}>This is a layout</h1>
      <nav>
        {invalidating && <p>Fetching new routes ...</p>}
        <ul>
          {data.map((x, i) => (
            <li key={i}>
              <a href={x}>{x}</a>
            </li>
          ))}
        </ul>
      </nav>
      <div>
        <h3>Some form</h3>
        <Form>
          <input type={"text"} name="email" placeholder="your@email.com" />
          {errors?.email && <span>Please provide a valid email {errors?.email}</span>}
          <button type={"submit"}>Submit</button>
        </Form>
      </div>
      {mutationResult && (<h3>Mutation executed correctly <span>{String(mutationResult)}</span></h3>)}
      <div>
        {children}
      </div>
    </div>
  );
});
