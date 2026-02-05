import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { FiChevronRight } from "react-icons/fi";
import { useEffect } from "react";
import useAnalaytics from "@/hooks/use-analytics";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import DesktopPageLayout from "@/components/layouts/desktop-page-layout";

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
  const { logEvent } = useAnalaytics();
  const isDesktop = useDesktopDetection();

  useEffect(() => {
    logEvent("PAGE_VISIT_INVEST");
  }, [logEvent]);

  const handleAssetClick = (asset: Asset) => {
    if (asset.comingSoon) {
      logEvent("VAULT_CARD_CLICKED", {
        product_id: asset.id,
        product_name: asset.name,
        apy: asset.apy,
        coming_soon: true,
      });
      return;
    }
    
    logEvent("VAULT_CARD_CLICKED", {
      product_id: asset.id,
      product_name: asset.name,
      apy: asset.apy,
      coming_soon: false,
    });
    
    navigate(`/app/invest/${asset.id}`);
  };

  const content = (
    <>
      {/* Header - Fixed at top */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`flex-shrink-0 ${
          isDesktop
            ? "px-8 py-8 bg-white rounded-2xl mx-8 mt-8 mb-4"
            : "px-4 py-4 border-b border-surface-subtle"
        }`}
      >
        <div className={isDesktop ? "max-w-4xl mx-auto" : ""}>
          <h1 className={`${isDesktop ? "text-3xl" : "text-xl"} font-semibold text-text-default`}>
            Earn
          </h1>
          <p className={`${isDesktop ? "text-base mt-2" : "text-sm"} text-text-subtle`}>
            Investment opportunities
          </p>
        </div>
      </motion.div>

      {/* Assets List - Scrollable */}
      <div
        className={`flex-1 overflow-y-auto overflow-x-hidden overscroll-contain ${
          isDesktop ? "p-8" : "p-4"
        }`}
      >
        <div className={`${isDesktop ? "max-w-4xl mx-auto" : ""} space-y-4`}>
          {ASSETS.map((asset) => (
            <motion.div
              key={asset.id}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onClick={() => handleAssetClick(asset)}
              className={`flex items-center gap-4 p-6 rounded-2xl border transition-all ${
                isDesktop
                  ? asset.comingSoon
                    ? "bg-white border-gray-200 opacity-60 cursor-not-allowed"
                    : "bg-white border-gray-200 cursor-pointer hover:border-accent-primary/30 hover:shadow-md"
                  : asset.comingSoon
                  ? "bg-surface-alt border-surface-subtle opacity-75 cursor-not-allowed"
                  : "bg-surface-alt border-surface-subtle cursor-pointer hover:bg-surface-subtle active:scale-[0.98]"
              }`}
            >
              {asset.imageUrl ? (
                <div
                  className={`${
                    isDesktop ? "w-14 h-14" : "w-12 h-12"
                  } rounded-xl bg-accent-primary flex items-center justify-center flex-shrink-0`}
                >
                  <img
                    src={asset.imageUrl}
                    alt={asset.name}
                    className={`${isDesktop ? "w-10 h-10" : "w-8 h-8"} object-contain`}
                  />
                </div>
              ) : (
                <div
                  className={`${
                    isDesktop ? "w-14 h-14" : "w-12 h-12"
                  } rounded-xl bg-accent-primary/10 flex items-center justify-center flex-shrink-0`}
                >
                  <span
                    className={`${
                      isDesktop ? "text-xl" : "text-lg"
                    } font-semibold text-accent-primary`}
                  >
                    {asset.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3
                    className={`${
                      isDesktop ? "text-lg" : "text-base"
                    } font-semibold text-text-default`}
                  >
                    {asset.name}
                  </h3>
                  {asset.apy && (
                    <span
                      className={`${
                        isDesktop ? "px-2 py-1 text-xs" : "px-1.5 py-0.5 text-[10px]"
                      } font-medium bg-success/10 text-success rounded-full`}
                    >
                      {asset.apy} APY
                    </span>
                  )}
                  {asset.isBeta && (
                    <span
                      className={`${
                        isDesktop ? "px-2 py-1 text-xs" : "px-1.5 py-0.5 text-[10px]"
                      } font-medium bg-accent-primary/10 text-accent-primary rounded-full`}
                    >
                      BETA
                    </span>
                  )}
                  {asset.comingSoon && (
                    <span
                      className={`${
                        isDesktop ? "px-2 py-1 text-xs" : "px-1.5 py-0.5 text-[10px]"
                      } font-medium bg-gray-100 text-gray-600 rounded-full`}
                    >
                      COMING SOON
                    </span>
                  )}
                </div>
                <p
                  className={`${
                    isDesktop ? "text-sm" : "text-sm"
                  } text-text-subtle leading-relaxed`}
                >
                  {asset.tagline}
                </p>
              </div>
              {!asset.comingSoon && (
                <FiChevronRight
                  className={`${
                    isDesktop ? "w-5 h-5" : "w-5 h-5"
                  } text-accent-primary flex-shrink-0`}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden bg-app-background">
      {isDesktop ? (
        <DesktopPageLayout maxWidth="lg" className="h-full">
          {content}
        </DesktopPageLayout>
      ) : (
        content
      )}
    </div>
  );
}

