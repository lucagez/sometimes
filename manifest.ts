const routes: Record<string, React.FC> = {};

import Route0 from "./src/app.tsx";
routes["src/app.tsx"] = Route0;

import Route1 from "./src/recipes.tsx";
routes["src/recipes.tsx"] = Route1;

import Route2 from "./src/about/me.tsx";
routes["src/about/me.tsx"] = Route2;

import Route3 from "./src/about/_layout.tsx";
routes["src/about/_layout.tsx"] = Route3;

import Route4 from "./src/_layout.tsx";
routes["src/_layout.tsx"] = Route4;

export { routes };
