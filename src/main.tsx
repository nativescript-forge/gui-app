import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

console.log("[Main] Starting application rendering...");

window.addEventListener("error", (event) => {
  console.error("[Main] Global Error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("[Main] Unhandled Rejection:", event.reason);
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
