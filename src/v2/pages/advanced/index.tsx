import { useNavigate } from "react-router";
import { ArrowLeftRight, ChevronRight, Coins, Plug, Repeat } from "lucide-react";
import { Page, PageHeader } from "@/v2/ui";

const ITEMS = [
  { id: "assets", label: "Assets", sub: "Your tokens on every network", icon: Coins, to: "/app/advanced/assets" },
  { id: "swap", label: "Swap", sub: "Trade one token for another", icon: Repeat, to: "/app/advanced/swap" },
  { id: "walletconnect", label: "WalletConnect", sub: "Use Rift with other apps", icon: Plug, to: "/app/advanced/walletconnect" },
  { id: "move", label: "Move funds", sub: "Bridge between networks", icon: ArrowLeftRight, to: "/app/convert" },
];

/** Tools for people who want more than payments. */
export default function Advanced() {
  const navigate = useNavigate();
  return (
    <Page width="narrow">
      <PageHeader title="Advanced" />
      <ul className="overflow-hidden rounded-2xl bg-card ring-1 ring-hairline" data-testid="advanced-list">
        {ITEMS.map((it, i) => (
          <li key={it.id} className={i ? "border-t border-hairline" : ""}>
            <button
              type="button"
              data-testid={`advanced-${it.id}`}
              onClick={() => navigate(it.to)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-surface-subtle cursor-pointer"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 text-accent-primary">
                <it.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-ink">{it.label}</span>
                <span className="block truncate text-[13px] text-ink-3">{it.sub}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-ink-3" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </Page>
  );
}
