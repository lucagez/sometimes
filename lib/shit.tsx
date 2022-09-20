import * as React from "react";

interface Props {
  children: React.ReactNode;
}

export const Shit =
  (Initial: React.FC, layouts: Array<React.FC<Props>>) => () =>
    layouts.slice().reverse().reduce((Prev: any, Curr: any, i) => {
      const P =
        () => (React.isValidElement(Prev) ? Prev : React.createElement(Prev));
      const C: React.FC<Props> = (
        { children },
      ) => (React.isValidElement(Curr)
        ? Curr
        : React.createElement(Curr, null, children));

      return (
        <C>
          <P />
        </C>
      );
    }, () => <Initial />) as unknown as React.ReactElement;
