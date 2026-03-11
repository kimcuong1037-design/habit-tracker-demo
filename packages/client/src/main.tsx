import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App.js";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register reminder Service Worker (DD-014)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw-reminder.js").catch(() => {
    // Service Worker registration failed — notifications will fall back to main thread
  });
}
