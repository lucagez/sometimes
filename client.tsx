import { hydrateRoot } from "react-dom/client";
import * as React from 'react'
import App from "./src/app.tsx";

// @ts-ignore: just ignore this
hydrateRoot(document.querySelector('#root'), <App />);
