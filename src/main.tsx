import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SnackBarProvider } from "./hooks/snackbar";
import App from "./App.tsx";
import Authentication from "./pages/Auth.tsx";
import Logout from "./pages/Logout.tsx";
import { TabsProvider } from "./hooks/tabs.tsx";
import "./styles/constants.css";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SnackBarProvider>
      <TabsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="" element={<App />} />
            <Route path="/signup" element={<Authentication />} />
            <Route path="/logout" element={<Logout />} />
          </Routes>
        </BrowserRouter>
      </TabsProvider>
    </SnackBarProvider>
  </StrictMode>
);
