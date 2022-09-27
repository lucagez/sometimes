import * as React from "react";
import { isomorphicPath } from "../../lib/isomorphic-path.ts";

const Dashboard: React.FC<React.PropsWithChildren> = ({ children }) => {
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

export default Dashboard