import { AnimatePresence } from "motion/react";
import { useEffect } from "react";
import ShellContextProvider from "./shell-context";
import PageContainer from "./page-container";
import useDesktopDetection from "@/hooks/use-desktop-detection";

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
        /* Desktop Layout - Full width, no constraints */
        <div className="fixed inset-0 bg-app-background overflow-hidden">
          <AnimatePresence mode="wait">
            <PageContainer />
          </AnimatePresence>
        </div>
      ) : (
        /* Mobile Layout - Centered, max-width container */
        <div className="fixed inset-0 flex flex-col items-center bg-surface-subtle overflow-hidden">
          {/* 
            Responsive container:
            - Mobile: full width
            - Tablet (md): centered with max-width 448px  
            - Desktop (lg+): centered with max-width 448px, with subtle background pattern
          */}
          <div className="w-full h-full max-w-md mx-auto relative bg-app-background md:rounded-none lg:shadow-2xl lg:border-x lg:border-surface-subtle overflow-hidden">
            <AnimatePresence mode="wait">
              <PageContainer />
            </AnimatePresence>
          </div>
        </div>
      )}
    </ShellContextProvider>
  );
}
