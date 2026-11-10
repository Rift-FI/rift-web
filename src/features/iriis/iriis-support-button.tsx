import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import iriisAvatar from "@/assets/iriis.jpeg";
import IriisChatPanel from "./iriis-chat-panel";

interface Props {
  /**
   * "mobile" — anchored inside the centered mobile card, lifted above
   * the bottom tabs. "desktop" — pinned to the viewport corner.
   */
  position?: "mobile" | "desktop";
}

/**
 * Floating "Chat with Iriis" button + the chat panel it opens.
 *
 *   <IriisSupportButton position="mobile" />
 *
 * Replaces the WhatsApp deep-link. Opens an in-app conversation with
 * Iriis (Rift's AI assistant). No cross-app hop, no phone number
 * requirement.
 */
/** Open the support chat from anywhere (e.g. the mobile "More" sheet). */
export const OPEN_SUPPORT_EVENT = "rift:open-support";
export function openSupportChat() {
  window.dispatchEvent(new Event(OPEN_SUPPORT_EVENT));
}

export default function IriisSupportButton({ position = "desktop" }: Props) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_SUPPORT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_SUPPORT_EVENT, onOpen);
  }, []);

  // Inside the signed-in console on mobile the bubble would sit on top of
  // content and the tab bar, so support lives in the "More" sheet instead.
  const inConsoleOnMobile = position === "mobile" && pathname.startsWith("/app");
  const positionClass =
    position === "mobile" ? "fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 h-12 w-12" : "fixed right-5 bottom-5 z-40 h-11 w-11";

  const variant = position === "mobile" ? "mobile" : "desktop";

  return (
    <>
      {!open && !inConsoleOnMobile && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Chat with Iriis, Rift's AI assistant"
          data-testid="support-bubble"
          className={`${positionClass} group grid cursor-pointer place-items-center rounded-full bg-card shadow-md ring-1 ring-hairline transition-shadow hover:shadow-lg`}
        >
          <img src={iriisAvatar} alt="" width={44} height={44} draggable={false} className="h-full w-full rounded-full object-cover" />
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-accent-primary/40 opacity-0 transition-opacity group-hover:opacity-100" />
          <span aria-hidden className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
        </button>
      )}
      <IriisChatPanel open={open} onClose={() => setOpen(false)} variant={variant} />
    </>
  );
}
