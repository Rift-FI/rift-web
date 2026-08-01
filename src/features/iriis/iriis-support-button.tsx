import { useState } from "react";
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
export default function IriisSupportButton({ position = "desktop" }: Props) {
  const [open, setOpen] = useState(false);

  const positionClass =
    position === "mobile"
      ? "absolute right-4 bottom-[5.5rem] z-40"
      : "fixed right-6 bottom-6 z-40";

  const variant = position === "mobile" ? "mobile" : "desktop";

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Chat with Iriis, Rift's AI assistant"
          className={`${positionClass} group grid h-14 w-14 cursor-pointer place-items-center rounded-full bg-white shadow-[0_10px_28px_-6px_rgba(15,42,56,0.28)] ring-1 ring-black/[0.04] transition-all hover:scale-[1.04] hover:shadow-[0_14px_36px_-6px_rgba(15,42,56,0.34)] active:scale-95`}
        >
          <img
            src={iriisAvatar}
            alt=""
            width={56}
            height={56}
            draggable={false}
            className="h-full w-full rounded-full object-cover"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-accent-primary/40 opacity-0 transition-opacity group-hover:opacity-100"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-0.5 rounded-full bg-accent-primary/20 opacity-70 animate-ping"
            style={{ animationDuration: "2.6s" }}
          />
          <span
            aria-hidden
            className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white"
          />
        </button>
      )}
      <IriisChatPanel
        open={open}
        onClose={() => setOpen(false)}
        variant={variant}
      />
    </>
  );
}
