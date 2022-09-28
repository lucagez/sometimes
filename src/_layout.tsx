/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from "react";

// RIPARTIRE QUI!<--
// - Wrap everything in #SERVER comment.
// - scope everything to BASE_PATH directory. Destroy everything else from bundle
// - implement secure mutations
// - implement csrf tokens (evaluate?)
// - wihout _layout everything breaks

export default ({ children }: any) => {
  return (
    <div>
      {children}
    </div>
  );
};
