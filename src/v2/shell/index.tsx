import { AnimatePresence } from "motion/react";
import ShellContextProvider from "./shell-context";
import PageContainer from "./page-container";

export default function AppShell() {
  return (
    <ShellContextProvider>
      <div className="w-screen h-screen flex flex-col items-center">
        <AnimatePresence mode="wait">
          <PageContainer />
        </AnimatePresence>
      </div>
    </ShellContextProvider>
  );
}
