import { JSX, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useBackButton } from "../hooks/backbutton";
import { useTabs } from "../hooks/tabs";
import { formatUsdSimple } from "../utils/formatters";
import { Premium as PremiumAnimation } from "../assets/animations";
import { ComingSoon } from "./transactions/Swap";
import {
  CheckAlt,
  ChatBot,
  Info,
  Import,
  Lock,
  NFT,
  QuickActions,
} from "../assets/icons/actions";
import telegramPremiumIcon from "../assets/images/telegram_premium.png";

export default function Premium(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { switchtab } = useTabs();
  const [showReference, setShowReference] = useState<boolean>(false);
  const infoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const goBack = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const returnPath = urlParams.get("returnPath");

    if (returnPath === "rewards") {
      switchtab("rewards");
    } else if (returnPath === "earn") {
      switchtab("earn");
    } else if (returnPath === "security") {
      switchtab("security");
    } else if (returnPath === "defi") {
      switchtab("earn");
    } else {
      switchtab("home");
    }

    navigate("/app");
  };

  const onSubscribe = () => {
    // Preserve the return path when navigating to SpherePremium
    const queryParams = new URLSearchParams(location.search);
    const returnPath = queryParams.get("returnPath");

    if (returnPath) {
      navigate(`/premiums/sphere?returnPath=${returnPath}`);
    } else {
      navigate("/premiums/sphere");
    }
  };

  const handleInfoPress = () => {
    setShowReference(true);

    if (infoTimeoutRef.current) {
      clearTimeout(infoTimeoutRef.current);
    }
  };

  const handleInfoRelease = () => {
    infoTimeoutRef.current = setTimeout(() => {
      setShowReference(false);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (infoTimeoutRef.current) {
        clearTimeout(infoTimeoutRef.current);
      }
    };
  }, []);

  useBackButton(goBack);

  return (
    <section className="min-h-screen bg-[#0e0e0e] px-4 py-6 pb-24 relative">
      {/* Premium Card */}
      <div className="bg-[#212121] rounded-2xl p-6 shadow-lg relative overflow-hidden">
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-2">
            <h1 className="text-[#f6f7f9] text-2xl font-bold">
              Sphere Premium
            </h1>
            <div className="space-y-1">
              <div className="text-[#f6f7f9] text-xl font-bold flex items-baseline">
                <span className="text-[#ffb386]">$</span>
                <span>{formatUsdSimple(3).replace("$", "")}</span>
                <span className="text-gray-400 text-sm ml-1">/mo</span>
              </div>
              <div
                className="inline-flex items-center gap-2 bg-[#ffb386]/10 px-3 py-1 rounded-full cursor-pointer"
                onTouchStart={handleInfoPress}
                onMouseDown={handleInfoPress}
                onTouchEnd={handleInfoRelease}
                onMouseUp={handleInfoRelease}
              >
                <span className="text-[#ffb386] text-sm">
                  ${formatUsdSimple(35).replace("$", "")}/mo Value
                </span>
                <Info width={14} height={14} color="#ffb386" />
              </div>
            </div>
          </div>
          <div className="w-32 h-32">
            <PremiumAnimation width="100%" height="100%" />
          </div>
        </div>

        {showReference && (
          <div className="absolute bottom-4 left-4 right-4 bg-[#2a2a2a] text-gray-400 text-sm py-2 px-4 rounded-xl">
            Ref: Ledger Recovery $10/mo | Casa Multi-sig Vault: $20/mo
          </div>
        )}
      </div>

      {/* Main Benefits */}
      <div className="mt-6 space-y-6">
        <div className="space-y-3">
          <PremiumFeature
            title="+100% OM Airdrop Boost"
            icon={
              <img
                src="/src/assets/images/labs/mantralogo.jpeg"
                className="w-5 h-5 rounded-full"
                alt="OM Token"
              />
            }
            highlight="accent"
          />

          <PremiumFeature
            title="Telegram Premium"
            description={`$${formatUsdSimple(5).replace("$", "")} value`}
            icon={
              <img
                src={telegramPremiumIcon}
                className="w-5 h-5"
                alt="Telegram Premium"
              />
            }
            highlight="telegram"
          />

          <PremiumFeature
            title="Physical Recovery"
            description={`$${formatUsdSimple(10).replace("$", "")} value`}
            icon={<Import width={20} height={20} color="#ffb386" />}
            highlight="accent"
          />

          <PremiumFeature
            title="Multi-sig Vault"
            description={`$${formatUsdSimple(20).replace("$", "")} value`}
            icon={<Lock width={20} height={20} color="#ffb386" />}
            highlight="accent"
          />
        </div>

        {/* Additional Benefits */}
        <div className="bg-[#212121] rounded-2xl p-4 space-y-4">
          <h3 className="text-[#f6f7f9] font-semibold">Additional Benefits</h3>
          <div className="grid grid-cols-2 gap-4">
            <BenefitItem
              title="Launchpad Priority"
              icon={<NFT width={16} height={16} color="#f6f7f9" />}
            />
            <BenefitItem
              title="$SPHR Token Airdrop"
              icon={<CheckAlt width={16} height={16} color="#7be891" />}
            />
            <BenefitItem
              title="Key Migration"
              icon={<Import width={16} height={16} color="#f6f7f9" />}
            />
            <BenefitItem
              title="Security Customization"
              icon={<Lock width={16} height={16} color="#f6f7f9" />}
            />
            <BenefitItem
              title="Lend-to-use Features"
              icon={<ChatBot width={16} height={16} color="#f6f7f9" />}
            />
          </div>
        </div>
      </div>

      <ComingSoon />

      {/* Subscribe Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0e0e0e]">
        <button
          onClick={onSubscribe}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#ffb386] text-[#0e0e0e] rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          <QuickActions width={16} height={16} color="#0e0e0e" />
          <span>Subscribe</span>
        </button>
      </div>
    </section>
  );
}

const PremiumFeature = ({
  title,
  description,
  icon,
  highlight = "",
}: {
  title: string;
  description?: string;
  icon: JSX.Element;
  highlight?: "accent" | "telegram" | "";
}): JSX.Element => {
  return (
    <div
      className={`flex items-center gap-4 bg-[#212121] p-4 rounded-xl ${
        highlight === "accent"
          ? "border border-[#ffb386]/20"
          : highlight === "telegram"
          ? "border border-[#4285F4]/20"
          : ""
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          highlight === "accent"
            ? "bg-[#ffb386]/10"
            : highlight === "telegram"
            ? "bg-[#4285F4]/10"
            : "bg-[#2a2a2a]"
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-[#f6f7f9] font-medium">{title}</p>
        {description && <p className="text-gray-400 text-sm">{description}</p>}
      </div>
    </div>
  );
};

const BenefitItem = ({
  title,
  icon,
}: {
  title: string;
  icon: JSX.Element;
}): JSX.Element => {
  return (
    <div className="flex items-center gap-3 p-3 bg-[#2a2a2a] rounded-xl hover:bg-[#2a2a2a]/80 transition-colors">
      <div className="w-8 h-8 rounded-full bg-[#212121] flex items-center justify-center">
        {icon}
      </div>
      <span className="text-[#f6f7f9] text-sm">{title}</span>
    </div>
  );
};
