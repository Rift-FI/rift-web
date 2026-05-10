import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  /** When `true`, the bar is mounted and animating across the viewport top. */
  visible: boolean;
  /** Tailwind class for the moving bars. Defaults to the Rift accent. */
  color?: string;
  /** Tailwind class for the resting track behind the bars. */
  trackColor?: string;
}

/**
 * Material-Design two-bar indeterminate progress bar pinned to the top of
 * the viewport — the same shape Google's sign-in popup uses across its
 * header. Use it whenever a long-running action ought to communicate "the
 * app is busy" beyond a single button.
 *
 *   <TopProgressBar visible={isSigningIn} />
 *
 * Renders into `document.body` via a portal so it can't be clipped by an
 * ancestor's `overflow: hidden`. After `visible` flips back to `false`
 * we hold the bar on screen for a beat (`exiting`) so a fast operation
 * doesn't flash on/off.
 */
export default function TopProgressBar({
  visible,
  color = "bg-accent-primary",
  trackColor = "bg-accent-primary/15",
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setExiting(false);
      return;
    }
    if (!mounted) return;
    setExiting(true);
    const t = setTimeout(() => {
      setMounted(false);
      setExiting(false);
    }, 250);
    return () => clearTimeout(t);
  }, [visible, mounted]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="progressbar"
      aria-busy={!exiting}
      aria-label="Loading"
      className={`fixed top-0 left-0 right-0 h-[3px] z-[9999] overflow-hidden ${trackColor} transition-opacity duration-200 ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
    >
      <span
        className={`absolute inset-y-0 ${color} animate-indeterminate-progress-primary`}
      />
      <span
        className={`absolute inset-y-0 ${color} animate-indeterminate-progress-secondary`}
        style={{ animationDelay: "1.15s" }}
      />
    </div>,
    document.body
  );
}
