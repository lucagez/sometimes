import * as React from 'react'

export default function Dashboard({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h2>This is a CHILD layout</h2>
      <div>
        {children}
      </div>
    </div>
  );
}
