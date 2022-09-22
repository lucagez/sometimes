import * as React from "react";
import { isomorphicPath } from "../../lib/isomorphic-path.ts";

export default function Dashboard({ children }: { children: React.ReactNode }) {
  console.log("meta child layout", isomorphicPath(import.meta.url));
  return (
    <div>
      <h2>This is a CHILD layout</h2>
      <div>
        {children}
      </div>
    </div>
  );
}
