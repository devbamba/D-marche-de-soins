import { createRoot } from "react-dom/client";
import { AppShell } from "./AppShell.jsx";
import { initializeLegacyApp } from "../app.js";
import "../style.css";

createRoot(document.getElementById("root")).render(
  <AppShell onReady={initializeLegacyApp}/>
);
