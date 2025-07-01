// PWA Shortcuts utilities for handling dynamic shortcuts and navigation

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

interface RecentActivity {
  id: string;
  type: "send" | "receive" | "swap";
  amount: string;
  token: string;
  timestamp: number;
  status: "completed" | "pending" | "failed";
}

// Get recent activities from localStorage or your data source
export const getRecentActivities = (): RecentActivity[] => {
  try {
    const activities = localStorage.getItem("recent-activities");
    return activities ? JSON.parse(activities) : [];
  } catch {
    return [];
  }
};

// Generate dynamic shortcuts based on recent activities
export const generateDynamicShortcuts = (): ActivityShortcut[] => {
  const recentActivities = getRecentActivities();
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

  // Add recent completed transactions as shortcuts
  const recentShortcuts = recentActivities
    .filter((activity) => activity.status === "completed")
    .slice(0, 2) // Limit to 2 most recent
    .map((activity) => ({
      name: `${
        activity.type === "send"
          ? "Sent"
          : activity.type === "receive"
          ? "Received"
          : "Swapped"
      } ${activity.amount} ${activity.token}`,
      short_name: `${activity.amount} ${activity.token}`,
      description: `View ${activity.type} transaction`,
      url: `/app/history?tx=${activity.id}`,
      timestamp: activity.timestamp,
      amount: activity.amount,
      token: activity.token,
      type: activity.type,
    }));

  return [...baseShortcuts, ...recentShortcuts].slice(0, 4); // Max 4 shortcuts
};

// Handle shortcut navigation when app is opened via shortcut
export const handleShortcutNavigation = (navigate: (path: string) => void) => {
  // Check if app was launched via shortcut
  const urlParams = new URLSearchParams(window.location.search);
  const shortcutUrl = window.location.pathname;

  // Handle different shortcut routes
  switch (shortcutUrl) {
    case "/app":
      // Already on home, no need to navigate
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
    // Default behavior - if coming from shortcuts, ensure we're authenticated
    // if (shortcutUrl.startsWith("/app/")) {
    //   navigate("/app");
    // }
    // break;
  }
};

// Update shortcuts dynamically (for future use with Dynamic Shortcuts API when available)
export const updateDynamicShortcuts = async (activities: RecentActivity[]) => {
  // Store recent activities for shortcut generation
  localStorage.setItem("recent-activities", JSON.stringify(activities));

  // Note: Dynamic Shortcuts API is not yet widely supported
  // This prepares for future implementation
  if ("setAppBadge" in navigator) {
    try {
      // Set app badge to show number of recent activities
      (navigator as any).setAppBadge(activities.length);
    } catch (error) {
      console.log("App badge not supported:", error);
    }
  }
};

// Clear app badge
export const clearAppBadge = () => {
  if ("clearAppBadge" in navigator) {
    try {
      (navigator as any).clearAppBadge();
    } catch (error) {
      console.log("App badge not supported:", error);
    }
  }
};
