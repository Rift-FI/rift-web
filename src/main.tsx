import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import eruda from "eruda";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SnackBarProvider } from "./hooks/snackbar";
import { AppDrawerProvider } from "./hooks/drawer.tsx";
import App from "./App.tsx";
import Authentication from "./pages/Auth.tsx";
import Logout from "./pages/Logout.tsx";
import CoinInfo from "./pages/CoinInfo.tsx";
import { TabsProvider } from "./hooks/tabs.tsx";
import "./styles/constants.css";
import "./styles/index.css";

// eruda.init();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SnackBarProvider>
      <AppDrawerProvider>
        <TabsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="" element={<App />} />
              <Route path="/signup" element={<Authentication />} />
              <Route path="/logout" element={<Logout />} />
              <Route path="/coin/:coinId" element={<CoinInfo />} />
            </Routes>
          </BrowserRouter>
        </TabsProvider>
      </AppDrawerProvider>
    </SnackBarProvider>
  </StrictMode>
);
