import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import posthog from "posthog-js";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { POSTHOG_HOST, POSTHOG_KEY } from "@/constants";
import { rift } from "@/lib/rift.ts";
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

posthog.init(POSTHOG_KEY, {
  api_host: POSTHOG_HOST,
  person_profiles: "identified_only",
});

const queryclient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryclient}>
      <BrowserRouter>{/* app */}</BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
