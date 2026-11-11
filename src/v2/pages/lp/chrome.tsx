import { ReactNode, useEffect, useLayoutEffect, useState } from "react";
import { Link } from "react-router";
import { LogOut, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, shortHash } from "@/v2/ui";
import { applyTheme } from "@/v2/lib/theme";
import { useLpSession } from "@/v2/lib/lp";
import { ConnectSheet } from "./connect";
import { lpPath } from "@/v2/lib/lpHost";

const THEME_KEY = "rift_theme";

/** Yield is dark unless the visitor picked light themselves ("system" counts as no choice). */
function storedChoice(): "light" | "dark" | null {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

function useLpTheme() {
  const [dark, setDark] = useState(() => storedChoice() !== "light");
  useLayoutEffect(() => {
    applyTheme(dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setDark(el.classList.contains("dark")));
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  const toggle = () => {
    const next = !dark;
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      /* storage unavailable: still switch for this visit */
    }
    setDark(next);
  };
  return { dark, toggle };
}

function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      data-testid="lp-theme"
      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-surface-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
    >
      {dark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}

/** Account control in the header: who is signed in, or a sign-in button. */
export function SessionControl() {
  const { session, signOut } = useLpSession();
  const [open, setOpen] = useState(false);
  if (!session)
    return (
      <>
        <Button size="sm" onClick={() => setOpen(true)} data-testid="lp-signin">
          Sign in
        </Button>
        <ConnectSheet open={open} onClose={() => setOpen(false)} />
      </>
    );
  return (
    <div className="flex items-center gap-1" data-testid="lp-session">
      <span className="inline-flex h-8 items-center gap-2 rounded-md border border-hairline px-2.5 text-[12.5px] font-medium text-ink-2">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
        {session.kind === "wallet" ? <span className="font-mono text-[12px]">{shortHash(session.address, 6, 4)}</span> : "Rift account"}
      </span>
      {session.kind === "wallet" && (
        <button
          type="button"
          onClick={signOut}
          aria-label="Disconnect wallet"
          data-testid="lp-signout"
          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-ink-3 hover:bg-surface-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** Terminal chrome for the Yield pages: slim bar, content, one-line footer. */
export function LpChrome({ children, wide = true }: { children: ReactNode; wide?: boolean }) {
  const { dark, toggle } = useLpTheme();
  return (
    <div className="flex h-full flex-col overflow-y-auto overflow-x-hidden bg-canvas text-ink" id="main" data-testid="lp-chrome">
      <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/95 backdrop-blur">
        <div className={cn("mx-auto flex h-11 w-full items-center justify-between gap-3 px-3 sm:px-4", wide ? "max-w-[1600px]" : "max-w-[1080px]")}>
          <Link to={lpPath("/")} className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary" aria-label="Rift Yield home">
            <img src="/rift.png" alt="" className="h-6 w-6 rounded" />
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Rift</span>
            <span aria-hidden="true" className="h-3.5 w-px bg-hairline-strong" />
            <span className="text-[14px] font-medium text-ink-2">Yield</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle dark={dark} onToggle={toggle} />
            <SessionControl />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-hairline">
        <div className={cn("mx-auto flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2.5 text-[11.5px] text-ink-3 sm:px-4", wide ? "max-w-[1600px]" : "max-w-[1080px]")}>
          <p>Not a bank deposit · Not insured · Not investment advice · You can lose money</p>
          <div className="flex items-center gap-3">
            <Link to={lpPath("/terms")} className="font-medium text-ink-2 hover:text-ink" data-testid="lp-terms-link">
              Terms
            </Link>
            <a href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer" className="hover:text-ink">
              Charts by TradingView
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
