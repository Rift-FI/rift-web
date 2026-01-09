import { BrowserRouter, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Splah from "@/features/splash/Page";
import Authentication from "@/features/auth/Page";
import Home from "@/features/home/Page";
import Account from "@/features/account/Page";

const queryclient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Splah />} />
        <Route path="/signin" element={<Authentication />} />
        <Route path="/app" element={<Home />} />
        <Route path="/app/account" element={<Account />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function AppProvider() {
  return (
    <QueryClientProvider client={queryclient}>
      <App />
    </QueryClientProvider>
  );
}
