import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { FiChevronRight } from "react-icons/fi";

interface Asset {
  id: string;
  name: string;
  tagline: string;
  imageUrl: string;
  isBeta?: boolean;
}

const ASSETS: Asset[] = [
  {
    id: "sail-vault",
    name: "Senior Vault",
    tagline: "Dollar-denominated savings with 5-8% APY. Beat inflation.",
    imageUrl: "https://www.liquidroyalty.com/sailr_logo.svg",
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
            onClick={() => navigate(`/app/invest/${asset.id}`)}
            className="flex items-center gap-4 p-4 bg-surface-alt rounded-xl cursor-pointer hover:bg-surface-subtle transition-all active:scale-[0.98] border border-surface-subtle"
          >
            <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center">
              <img
                src={asset.imageUrl}
                alt={asset.name}
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-text-default">{asset.name}</h3>
                {asset.isBeta && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-accent-primary/20 text-accent-primary rounded">
                    BETA
                  </span>
                )}
              </div>
              <p className="text-sm text-text-subtle">{asset.tagline}</p>
            </div>
            <FiChevronRight className="w-5 h-5 text-text-subtle" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

