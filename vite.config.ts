import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
// import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // server: { allowedHosts: ["20bf94153e27.ngrok.app"] },
});
