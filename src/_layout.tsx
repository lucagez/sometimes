import * as React from 'react'
import { withServerState } from '../lib/server.tsx'

// deno-lint-ignore require-await
const Navbar = withServerState('navbar', async () => {
  if (BUNDLER) return
  return ['/app', '/about/me']
})(({ data }) => {
  return <nav>{data!.map((x, i) => <a key={i} href={x}>{x}</a>)}</nav>
})

export default function Dashboard({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Navbar />
      <h1>This is a layout</h1>
      <div>
        {children}
      </div>
    </div>
  );
}
