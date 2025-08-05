import { openLink } from "@telegram-apps/sdk-react";
import { usePlatformDetection } from "@/utils/platform";
import hyperliquidlogo from "@/assets/hyperliquid.png";

export default function HyperLiquid() {
  const { isTelegram } = usePlatformDetection();

  const onTrade = () => {
    if (isTelegram) {
      openLink("https://app.hyperliquid.xyz/join/STRATOLABS");
    }
    window.open("https://app.hyperliquid.xyz/join/STRATOLABS");
  };

  return (
    <div
      onClick={onTrade}
      className="w-full p-4 py-3 flex flex-row items-center justify-start bg-secondary rounded-2xl cursor-pointer hover:bg-surface-subtle transition-colors gap-2"
    >
      <img src={hyperliquidlogo} alt="hyperliquid" className="w-10 h-10" />

      <p className="text-sm font-bold">
        HyperLiquid <br />
        <span className="text-sm text-text-subtle font-light">
          Explore decentralized derivatives trading
        </span>
      </p>
    </div>
  );
}
