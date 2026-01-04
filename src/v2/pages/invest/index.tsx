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
    name: "Sail Vault",
    tagline: "Invest in an Amazon shop in Shenzhen and earn monthly dividends",
    imageUrl: "https://www.liquidroyalty.com/sailr_logo.svg",
    isBeta: true,
  },
];

export default function Invest() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full bg-app-background"
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-surface-subtle">
        <h1 className="text-xl font-bold text-text-default">Earn</h1>
        <p className="text-sm text-text-subtle">Investment opportunities</p>
      </div>

      {/* Assets List */}
      <div className="p-4 space-y-3">
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
    </motion.div>
  );
}

