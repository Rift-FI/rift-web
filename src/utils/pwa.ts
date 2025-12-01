export const registerSW = () => {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("SW registered: ", registration);
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError);
        });
    });
  }
};

export const isInstalled = (): boolean => {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
};

export const isOffline = (): boolean => {
  return !navigator.onLine;
};

export const addToHomeScreen = async (): Promise<boolean> => {
  try {
    const event = (window as any).deferredPrompt;
    if (event) {
      event.prompt();
      const { outcome } = await event.userChoice;
      return outcome === "accepted";
    }
    return false;
  } catch (error) {
    console.error("Error adding to home screen:", error);
    return false;
  }
};
