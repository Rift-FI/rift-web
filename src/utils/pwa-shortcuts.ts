interface ActivityShortcut {
  name: string;
  short_name: string;
  description: string;
  url: string;
  timestamp?: number;
  amount?: string;
  token?: string;
  type?: "send" | "receive" | "swap" | "history" | "home" | "buy";
}

export const generateShortcuts = (): ActivityShortcut[] => {
  const baseShortcuts: ActivityShortcut[] = [
    {
      name: "Wallet Home",
      short_name: "Home",
      description: "View your wallet balance and tokens",
      url: "/app",
      type: "home",
    },
    {
      name: "Swap Tokens",
      short_name: "Swap",
      description: "Exchange cryptocurrencies",
      url: "/app/swap",
      type: "swap",
    },
    {
      name: "Transaction History",
      short_name: "History",
      description: "View recent transactions",
      url: "/app/history",
      type: "history",
    },
    {
      name: "Buy Crypto",
      short_name: "Buy",
      description: "Purchase cryptocurrency",
      url: "/app/oo",
      type: "buy",
    },
  ];

  return [...baseShortcuts];
};

export const handleShortcutNavigation = (navigate: (path: string) => void) => {
  const urlParams = new URLSearchParams(window.location.search);
  const shortcutUrl = window.location.pathname;

  switch (shortcutUrl) {
    case "/app":
      break;
    case "/app/swap":
      navigate("/app/swap");
      break;
    case "/app/history":
      const txId = urlParams.get("tx");
      if (txId) {
        navigate(`/app/history?highlight=${txId}`);
      } else {
        navigate("/app/history");
      }
      break;
    case "/app/oo":
      navigate("/app/oo");
      break;
    default:
      console.log("PWA unhadled shortcut route");
  }
};

export const clearAppBadge = () => {
  if ("clearAppBadge" in navigator) {
    try {
      (navigator as any).clearAppBadge();
    } catch (error) {
      console.log("App badge not supported:", error);
    }
  }
};
