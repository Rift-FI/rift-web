import { AnimatePresence } from "motion/react";
import { useEffect } from "react";
import ShellContextProvider from "./shell-context";
import PageContainer from "./page-container";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import IriisSupportButton from "@/features/iriis/iriis-support-button";

export default function AppShell() {
  const isDesktop = useDesktopDetection();

  useEffect(() => {
    // Call Farcaster Mini App SDK ready() to hide splash screen
    const notifyFarcasterReady = async () => {
      try {
        // Dynamically import to avoid errors if not in Farcaster context
        const { sdk } = await import("@farcaster/miniapp-sdk");
        await sdk.actions.ready();
      } catch {
        // SDK not available or not in Farcaster context - this is fine
      }
    };

    notifyFarcasterReady();
  }, []);

  return (
    <ShellContextProvider>
      {isDesktop ? (
        /* Desktop Layout - Full width with sidebar shell handled downstream */
        <div className="fixed inset-0 bg-app-background overflow-hidden">
          <AnimatePresence mode="wait">
            <PageContainer />
          </AnimatePresence>
          <IriisSupportButton position="desktop" />
        </div>
      ) : (
        /* Mobile / narrow-viewport layout — centered card on wide screens */
        <div className="fixed inset-0 flex flex-col items-center bg-gradient-to-br from-[#E9F1F4] via-[#E9F1F4] to-[#DDEBF0] overflow-hidden">
          <div className="w-full h-full max-w-md mx-auto relative bg-app-background overflow-hidden md:my-4 md:h-[calc(100dvh-2rem)] md:rounded-[28px] md:shadow-[0_20px_60px_-15px_rgba(15,42,56,0.2)] md:border md:border-white/60">
            <AnimatePresence mode="wait">
              <PageContainer />
            </AnimatePresence>
            <IriisSupportButton position="mobile" />
          </div>
        </div>
      )}
    </ShellContextProvider>
  );
}
