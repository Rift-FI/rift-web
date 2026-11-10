import { AnimatePresence, MotionConfig } from "motion/react";
import { useEffect } from "react";
import PageContainer from "./page-container";

export default function AppShell() {

  useEffect(() => {
    // Call Farcaster Mini App SDK ready() to hide splash screen
    const notifyFarcasterReady = async () => {
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");
        await sdk.actions.ready();
      } catch {
        // SDK not available or not in Farcaster context - this is fine
      }
    };
    notifyFarcasterReady();
  }, []);

  return (
    // reducedMotion="user": Framer Motion honours prefers-reduced-motion
    // (drops transform animations, keeps opacity) across every page.
    <MotionConfig reducedMotion="user">
      {/* One responsive layout: the console shell switches between sidebar
          (lg and up) and bottom tab bar itself, full-bleed at every width. */}
      <div className="fixed inset-0 overflow-hidden bg-canvas">
        <AnimatePresence mode="wait">
          <PageContainer />
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
