import { useEffect } from "react";
const APP_ENV = import.meta.env.VITE_APP_ENV ?? "unknown";
export function DevelopmentTools() {
  useEffect(() => {
    if (APP_ENV == "preview" || import.meta.env.MODE == "development") {
      document.body.removeAttribute("oncontextmenu");
      console.log("Done");
    }
  }, []);
  return <></>;
}
