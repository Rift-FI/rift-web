import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
// import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    cors: true,
    hmr: {
      host: "localhost",
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    allowedHosts: ["sphereid.ngrok.app", ".ngrok.app", ".ngrok.io"],
  },
});
