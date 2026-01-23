import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { FiChevronRight } from "react-icons/fi";

interface Asset {
  id: string;
  name: string;
  tagline: string;
  imageUrl?: string;
  isBeta?: boolean;
  comingSoon?: boolean;
  apy?: string;
}

const ASSETS: Asset[] = [
  {
    id: "sail-vault",
    name: "Senior Vault",
    tagline: "Dollar-denominated savings with around 10% APY. Beat inflation.",
    imageUrl: "https://www.liquidroyalty.com/sailr_logo.svg",
    apy: "~10%",
  },
  {
    id: "estate-royalty",
    name: "Estate Royalty",
    tagline: "Own a share of a property's rent and get paid every month, without the stress of managing one.",
    imageUrl: "https://www.estateroyalty.io/logo.png",
    comingSoon: true,
    apy: "~15%",
  },
  {
    id: "tapin",
    name: "Tapin",
    tagline: "Own a slice of the fastest growing businesses in Africa and Asia and receive monthly dividends.",
    comingSoon: true,
    apy: "~12%",
  },
];

export default function Invest() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col overflow-hidden bg-app-background">
      {/* Header - Fixed at top */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-shrink-0 px-4 py-4 border-b border-surface-subtle"
      >
        <h1 className="text-xl font-bold text-text-default">Earn</h1>
        <p className="text-sm text-text-subtle">Investment opportunities</p>
      </motion.div>

      {/* Assets List - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-4 space-y-3">
        {ASSETS.map((asset) => (
          <motion.div
            key={asset.id}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={asset.comingSoon ? undefined : () => navigate(`/app/invest/${asset.id}`)}
            className={`flex items-center gap-4 p-4 bg-surface-alt rounded-xl border border-surface-subtle transition-all ${
              asset.comingSoon 
                ? "opacity-75 cursor-not-allowed" 
                : "cursor-pointer hover:bg-surface-subtle active:scale-[0.98]"
            }`}
          >
            {asset.imageUrl ? (
              <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center">
                <img
                  src={asset.imageUrl}
                  alt={asset.name}
                  className="w-8 h-8 object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-surface-subtle flex items-center justify-center">
                <span className="text-lg font-semibold text-text-subtle">
                  {asset.name.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-text-default">{asset.name}</h3>
                {asset.apy && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-500/20 text-green-600 rounded">
                    {asset.apy} APY
                  </span>
                )}
                {asset.isBeta && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-accent-primary/20 text-accent-primary rounded">
                    BETA
                  </span>
                )}
                {asset.comingSoon && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-500/20 text-gray-600 rounded">
                    COMING SOON
                  </span>
                )}
              </div>
              <p className="text-sm text-text-subtle">{asset.tagline}</p>
            </div>
            {!asset.comingSoon && (
              <FiChevronRight className="w-5 h-5 text-text-subtle" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

