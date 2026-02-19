/** Apply saved theme before first paint to avoid flash and keep preference across navigations (e.g. /lock). */
if (typeof document !== "undefined" && typeof localStorage !== "undefined") {
  const theme = localStorage.getItem("genmypass_theme");
  if (theme === "dark") document.documentElement.classList.add("dark");
  else if (theme === "light") document.documentElement.classList.remove("dark");
}

import "./i18n";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./fonts.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
