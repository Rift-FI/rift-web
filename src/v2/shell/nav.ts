import {
  ArrowDownLeft,
  ArrowUpRight,
  Home,
  Inbox,
  Link2,
  ListOrdered,
  Settings,
  type LucideIcon,
} from "lucide-react";

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
 * The console's information architecture. Desktop shows every item in the
 * sidebar; mobile shows the first four in the tab bar plus "More".
 */
export const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", to: "/app", icon: Home, match: ["/app"], exact: true },
  { id: "payments", label: "Payments", to: "/app/payments", icon: ListOrdered, match: ["/app/payments"] },
  { id: "send", label: "Send", to: "/app/send", icon: ArrowUpRight, match: ["/app/send", "/app/pay", "/app/withdraw", "/app/convert"] },
  { id: "receive", label: "Receive", to: "/app/receive", icon: ArrowDownLeft, match: ["/app/receive", "/app/request"] },
  { id: "payment-links", label: "Payment links", to: "/app/payment-links", icon: Link2, match: ["/app/payment-links", "/app/merchant"] },
  { id: "approvals", label: "Approvals", to: "/app/approvals", icon: Inbox, match: ["/app/approvals"] },
  { id: "settings", label: "Settings", to: "/app/settings", icon: Settings, match: ["/app/settings", "/app/profile", "/app/walletconnect"] },
];

export const MOBILE_TABS = ["home", "payments", "send", "receive"];

export function isActive(item: NavItem, pathname: string) {
  const path = pathname.replace(/\/$/, "") || "/";
  if (item.exact) return path === item.to;
  return item.match.some((m) => path === m || path.startsWith(`${m}/`));
}
