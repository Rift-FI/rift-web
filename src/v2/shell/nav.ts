import { CandlestickChart, Home, Inbox, Layers, Link2, ListOrdered, Settings, type LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  /** Paths (prefixes) that light this item up. */
  match: string[];
  exact?: boolean;
}

/**
 * PREMIA trading — invite-only. It is NOT in the base nav: access depends on a
 * redeemed invite, which is only known at runtime, so the shell splices this
 * in via {@link navItemsFor}. A user who has not redeemed sees no trace of it.
 */
export const PREMIA_NAV_ITEM: NavItem = {
  id: "markets",
  label: "Markets",
  to: "/app/markets",
  icon: CandlestickChart,
  match: ["/app/markets", "/app/portfolio"],
};

/** Desktop sidebar. Money actions live on Home, not in the nav. */
export const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", to: "/app", icon: Home, match: ["/app", "/app/send", "/app/pay", "/app/withdraw", "/app/add-funds", "/app/request"], exact: true },
  { id: "activity", label: "Activity", to: "/app/payments", icon: ListOrdered, match: ["/app/payments"] },
  { id: "payment-links", label: "Payment links", to: "/app/payment-links", icon: Link2, match: ["/app/payment-links", "/app/merchant"] },
  { id: "approvals", label: "Approvals", to: "/app/approvals", icon: Inbox, match: ["/app/approvals"] },
  { id: "advanced", label: "Advanced", to: "/app/advanced", icon: Layers, match: ["/app/advanced", "/app/convert", "/app/walletconnect"] },
  { id: "settings", label: "Settings", to: "/app/settings", icon: Settings, match: ["/app/settings", "/app/profile"] },
];

/** Mobile tab bar. PREMIA's "Markets" joins the row only for invited users. */
export const MOBILE_TABS = ["home", "activity", "advanced", "settings"];

/** The nav for this user. `premia` is true only with the flag AND an invite. */
export function navItemsFor(premia: boolean): NavItem[] {
  if (!premia) return NAV_ITEMS;
  const out = [...NAV_ITEMS];
  out.splice(1, 0, PREMIA_NAV_ITEM);
  return out;
}

/** The mobile tabs for this user, in the same order as the sidebar. */
export function mobileTabsFor(premia: boolean): string[] {
  return premia ? ["home", "markets", "activity", "advanced", "settings"] : MOBILE_TABS;
}

const HOME_FLOWS = ["/app/send", "/app/pay", "/app/withdraw", "/app/add-funds", "/app/request"];

export function isActive(item: NavItem, pathname: string) {
  const path = pathname.replace(/\/$/, "") || "/";
  if (item.id === "home") return path === "/app" || HOME_FLOWS.some((m) => path === m || path.startsWith(`${m}/`));
  if (item.exact) return path === item.to;
  return item.match.some((m) => path === m || path.startsWith(`${m}/`));
}
