import { Home, Inbox, Layers, Link2, ListOrdered, Settings, type LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  /** Paths (prefixes) that light this item up. */
  match: string[];
  exact?: boolean;
}

/** Desktop sidebar. Money actions live on Home, not in the nav. */
export const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", to: "/app", icon: Home, match: ["/app", "/app/send", "/app/pay", "/app/withdraw", "/app/receive", "/app/request"], exact: true },
  { id: "activity", label: "Activity", to: "/app/payments", icon: ListOrdered, match: ["/app/payments"] },
  { id: "payment-links", label: "Payment links", to: "/app/payment-links", icon: Link2, match: ["/app/payment-links", "/app/merchant"] },
  { id: "approvals", label: "Approvals", to: "/app/approvals", icon: Inbox, match: ["/app/approvals"] },
  { id: "advanced", label: "Advanced", to: "/app/advanced", icon: Layers, match: ["/app/advanced", "/app/convert", "/app/walletconnect"] },
  { id: "settings", label: "Settings", to: "/app/settings", icon: Settings, match: ["/app/settings", "/app/profile"] },
];

/** Mobile tab bar. */
export const MOBILE_TABS = ["home", "activity", "advanced", "settings"];

const HOME_FLOWS = ["/app/send", "/app/pay", "/app/withdraw", "/app/receive", "/app/request"];

export function isActive(item: NavItem, pathname: string) {
  const path = pathname.replace(/\/$/, "") || "/";
  if (item.id === "home") return path === "/app" || HOME_FLOWS.some((m) => path === m || path.startsWith(`${m}/`));
  if (item.exact) return path === item.to;
  return item.match.some((m) => path === m || path.startsWith(`${m}/`));
}
