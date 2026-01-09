import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { rift } from "@/lib/rift.ts";
import App from "./App";
import "@/styles/index.scss";
import "@/styles/tailwind.css";

const token = localStorage.getItem("token");

if (token) {
  rift.auth.setBearerToken(token);
}

if (import.meta.env.MODE === "development") {
  const shouldClearPusherCache = localStorage.getItem("clear_pusher_cache");
  if (shouldClearPusherCache === "true") {
    console.log("[Dev] Auto-clearing Pusher Beams cache...");

    indexedDB.databases().then((databases) => {
      databases.forEach((db) => {
        if (
          db.name &&
          (db.name.includes("pusher") || db.name.includes("beams"))
        ) {
          indexedDB.deleteDatabase(db.name);
          console.log("Deleted indexdDb", db.name);
        }
      });
    });

    localStorage.removeItem("clear_pusher_cache");
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
