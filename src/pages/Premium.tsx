import { JSX, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useBackButton } from "../hooks/backbutton";
import { useTabs } from "../hooks/tabs";
import { formatUsdSimple } from "../utils/formatters";
import { SubmitButton } from "../components/global/Buttons";
import { colors } from "../constants";
import { Premium as PremiumAnimation } from "../assets/animations";
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
import "../styles/pages/premiums.scss";

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
    <section id="premium">
      <div className="premium-card">
        <div className="card-content">
          <div className="header-content">
            <h1>Sphere Premium</h1>
            <div className="value-tag">
              <span>
                {formatUsdSimple(3)}
                <small>/mo</small>
              </span>
              <div
                className="worth-tag"
                onTouchStart={handleInfoPress}
                onMouseDown={handleInfoPress}
                onTouchEnd={handleInfoRelease}
                onMouseUp={handleInfoRelease}
              >
                <p>{formatUsdSimple(35)}/mo Value</p>
                <Info width={14} height={14} color={colors.textprimary} />
              </div>
            </div>
          </div>
          <div className="img">
            <PremiumAnimation width="8rem" height="8rem" />
          </div>
        </div>

        {showReference && (
          <div className="reference-info">
            <p>Ref: Ledger Recovery $10/mo | Casa Multi-sig Vault: $20/mo</p>
          </div>
        )}
      </div>

      <div className="benefits-container">
        <div className="main-benefits">
          <PremiumFeature
            title="+100% OM Airdrop Boost"
            icon={
              <img
                src="/src/assets/images/labs/mantralogo.jpeg"
                width="20"
                height="20"
                className="feature-icon"
              />
            }
            highlight="accent"
          />

          <PremiumFeature
            title="Telegram Premium"
            description={formatUsdSimple(5) + " value"}
            icon={
              <img
                src={telegramPremiumIcon}
                width="20"
                height="20"
                className="feature-icon"
              />
            }
            highlight="telegram"
          />

          <PremiumFeature
            title="Physical Recovery"
            description={formatUsdSimple(10) + " value"}
            icon={<Import width={20} height={20} color={colors.accent} />}
            highlight="accent"
          />

          <PremiumFeature
            title="Multi-sig Vault"
            description={formatUsdSimple(20) + " value"}
            icon={<Lock width={20} height={20} color={colors.accent} />}
            highlight="accent"
          />
        </div>

        <div className="additional-benefits">
          <div className="benefit-row">
            <BenefitItem
              title="Launchpad Priority"
              icon={<NFT width={16} height={16} color={colors.textprimary} />}
            />
            <BenefitItem
              title="$SPHERE Token Airdrop"
              icon={<CheckAlt width={16} height={16} color={colors.success} />}
            />
          </div>

          <div className="benefit-row">
            <BenefitItem
              title="Key Migration"
              icon={
                <Import width={16} height={16} color={colors.textprimary} />
              }
            />
            <BenefitItem
              title="Security Customization"
              icon={<Lock width={16} height={16} color={colors.textprimary} />}
            />
          </div>

          <div className="benefit-row">
            <BenefitItem
              title="Lend-to-use Features"
              icon={
                <ChatBot width={16} height={16} color={colors.textprimary} />
              }
            />
          </div>
        </div>
      </div>

      <div className="subscribe-button-container">
        <SubmitButton
          text="Subscribe"
          icon={
            <QuickActions width={12} height={12} color={colors.textprimary} />
          }
          sxstyles={{
            width: "100%",
            gap: "0.5rem",
            height: "2.65rem",
            borderRadius: "0.5rem",
          }}
          onclick={onSubscribe}
        />
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
    <div className={`premium-feature ${highlight}`}>
      <div className="feature-icon-container">{icon}</div>
      <div className="feature-content">
        <p className="feature-title">{title}</p>
        {description && <p className="feature-description">{description}</p>}
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
    <div className="benefit-item">
      {icon}
      <span>{title}</span>
    </div>
  );
};
