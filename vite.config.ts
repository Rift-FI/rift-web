import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
// import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { allowedHosts: ["*", "0fe7fec929d2.ngrok.app"] },
});
