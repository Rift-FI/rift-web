import { AnimatePresence } from "motion/react";
import { useEffect } from "react";
import ShellContextProvider from "./shell-context";
import PageContainer from "./page-container";

export default function AppShell() {
  useEffect(() => {
    // Call Farcaster Mini App SDK ready() to hide splash screen
    const notifyFarcasterReady = async () => {
      try {
        // Dynamically import to avoid errors if not in Farcaster context
        const { sdk } = await import("@farcaster/miniapp-sdk");
        await sdk.actions.ready();
        console.log("Farcaster Mini App ready() called");
      } catch (error) {
        // SDK not available or not in Farcaster context - this is fine
        console.log("Not running in Farcaster context or SDK not available");
      }
    };

    notifyFarcasterReady();
  }, []);

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
