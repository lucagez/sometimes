import * as React from "react";
import { withServerMutation, withServerState } from "../lib/server.tsx";
import { add } from "../server/some-func.ts";

let routes = ["/app", "/about/me", "/blog"];

// setInterval(() => {
//   routes.push('other-route')
// }, 1000)

// deno-lint-ignore require-await
const loader = withServerState<string[], string>(import.meta.url, async () => {
  return routes;
});

// RIPARTIRE QUI!<--
// - Wrap everything in #SERVER comment.
// - scope everything to BASE_PATH directory. Destroy everything else from bundle
// - implement secure mutations
// - implement csrf tokens (evaluate?)

withServerMutation<string>(import.meta.url, async (req: Request) => {
  const data = await req.formData();
  const email = data.get("email");

  if (!email?.toString().endsWith("@gmail.com")) {
    return {
      // result: "",
      errors: {
        email: "Please provide an email ending with @gmail.com",
      },
    };
  }

  return {
    result: "success! registered email " + email,
  };
});

export default loader(
  (
    {
      children,
      data,
      invalidate,
      invalidating,
      result,
      errors,
      Form,
      mutating,
    },
  ) => {
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
            <div>
              {errors?.email && (
                <span>Please provide a valid email {errors?.email}</span>
              )}
            </div>
            <button type={"submit"} disabled={mutating}>
              {mutating ? "Loading..." : "Submit"}
            </button>
          </Form>
        </div>
        <div>
          {result && (
            <h3>
              Mutation executed correctly <span>{result}</span>
            </h3>
          )}
        </div>
        <div>
          {children}
        </div>
      </div>
    );
  },
);
