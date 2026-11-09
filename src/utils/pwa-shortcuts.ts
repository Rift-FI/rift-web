interface ActivityShortcut {
  name: string;
  short_name: string;
  description: string;
  url: string;
  timestamp?: number;
  amount?: string;
  token?: string;
  type?: "send" | "receive" | "history" | "home";
}

export const generateShortcuts = (): ActivityShortcut[] => [
  { name: "Home", short_name: "Home", description: "Balance and recent payments", url: "/app", type: "home" },
  { name: "Send money", short_name: "Send", description: "Pay to mobile money, bank or wallet", url: "/app/send", type: "send" },
  { name: "Payments", short_name: "Payments", description: "Payment history and receipts", url: "/app/payments", type: "history" },
  { name: "Receive", short_name: "Receive", description: "Account address and payment links", url: "/app/receive", type: "receive" },
];

export const handleShortcutNavigation = (navigate: (path: string) => void) => {
  const urlParams = new URLSearchParams(window.location.search);
  switch (window.location.pathname) {
    case "/app/history": {
      // Old shortcut / notification links.
      const txId = urlParams.get("tx");
      navigate(txId ? `/app/payments?q=${encodeURIComponent(txId)}` : "/app/payments");
      break;
    }
    default:
      break;
  }
};

export const clearAppBadge = () => {
  if ("clearAppBadge" in navigator) {
    try {
      (navigator as any).clearAppBadge();
    } catch (error) {
      
    }
  }
};
