import { useState } from "react";
import * as React from "react";
import { withServerState } from "../lib/server.tsx";

function Home({ data }: { data: number }) {
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
        <strong>Ultra</strong>. This is a barbones starter for your web app.
      </p>
    </main>
  );
}

export default withServerState("bananas", () => Promise.resolve(123))(Home);
