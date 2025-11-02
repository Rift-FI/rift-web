import { AnimatePresence } from "motion/react";
import ShellContextProvider from "./shell-context";
import PageContainer from "./page-container";

export default function AppShell() {
  return (
    <ShellContextProvider>
      <div className="w-screen h-screen flex flex-col items-center bg-app-background">
        {/* Desktop: max-width container, Mobile: full width */}
        <div className="w-full h-full max-w-md mx-auto relative bg-app-background shadow-2xl">
          <AnimatePresence mode="wait">
            <PageContainer />
          </AnimatePresence>
        </div>
      </div>
    </ShellContextProvider>
  );
}
