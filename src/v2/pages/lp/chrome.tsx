import { ReactNode, useState } from "react";
import { Link } from "react-router";
import { LogOut, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, shortHash } from "@/v2/ui";
import { useTheme } from "@/v2/lib/theme";
import { useLpSession } from "@/v2/lib/lp";
import { ConnectSheet } from "./connect";

function ThemeToggle() {
  const { setTheme } = useTheme();
  const dark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const [isDark, setIsDark] = useState(dark);
  return (
    <button
      type="button"
      onClick={() => {
        setTheme(isDark ? "light" : "dark");
        setIsDark(!isDark);
      }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-surface-subtle hover:text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
    >
      {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}

/** Account control in the public header: who is signed in, or a sign-in button. */
export function SessionControl({ compact }: { compact?: boolean }) {
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
    <div className="flex items-center gap-1.5" data-testid="lp-session">
      <span className={cn("inline-flex h-8 items-center gap-2 rounded-full bg-surface-subtle px-3 text-[13px] font-medium text-ink-2", compact && "max-sm:hidden")}>
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
        {session.kind === "wallet" ? <span className="font-mono text-[12.5px]">{shortHash(session.address, 6, 4)}</span> : "Rift account"}
      </span>
      {session.kind === "wallet" && (
        <button
          type="button"
          onClick={signOut}
          aria-label="Disconnect wallet"
          data-testid="lp-signout"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-3 hover:bg-surface-subtle hover:text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** Standalone chrome for the public /lp pages (outside the signed-in console). */
export function LpChrome({ children }: { children: ReactNode }) {
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden bg-canvas text-ink" id="main" data-testid="lp-chrome">
      <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1080px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
          <Link to="/lp" className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary" aria-label="Rift Yield home">
            <img src="/rift.png" alt="" className="h-7 w-7 rounded-md" />
            <span className="text-[16px] font-semibold tracking-[-0.01em] text-ink">Rift</span>
            <span aria-hidden="true" className="h-4 w-px bg-hairline-strong" />
            <span className="text-[15px] font-medium text-ink-2">Yield</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <SessionControl compact />
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-hairline">
        <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-2 px-4 py-6 text-[12.5px] text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
          <p>Not a bank deposit. Not insured. Not investment advice. You can lose money.</p>
          <Link to="/lp/terms" className="font-medium text-ink-2 hover:text-ink">
            LP Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
