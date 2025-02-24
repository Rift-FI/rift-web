import { JSX, useEffect, useState } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { useTabs } from "../hooks/tabs";
import { formatUsd } from "../utils/formatters";
import { colors } from "../constants";
import { Premium as PremiumAnimation } from "../assets/animations";
import { CheckAlt, QuickActions, Telegram } from "../assets/icons/actions";
import "../styles/pages/premiums.scss";

type premiumoptions = "telegram" | "strato";

export default function Premium(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const [selectPreium, setSelectPremium] = useState<premiumoptions>("strato");
  const [premiumDuration, setPremiumDuration] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  const onSubscribe = () => {
    selectPreium == "strato"
      ? navigate("/premiums/sphere")
      : navigate("/premiums/tg");
  };

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(goBack);
    }

    return () => {
      backButton.offClick(goBack);
      backButton.unmount();
    };
  }, []);

  return (
    <section id="premium">
      <div className="img">
        <PremiumAnimation width="12rem" height="12rem" />
      </div>

      <p className="_title">Premium</p>

      <div className="duration">
        <p className="cost">
          {selectPreium == "strato" && premiumDuration == "monthly"
            ? formatUsd(3)
            : selectPreium == "strato" && premiumDuration == "yearly"
            ? formatUsd(38)
            : selectPreium == "telegram" && premiumDuration == "monthly"
            ? formatUsd(3.99)
            : formatUsd(28.99)}
          &nbsp;
          <span>/ {premiumDuration == "monthly" ? "month" : "year"}</span>
        </p>

        <p className="save">
          Save<span> {selectPreium == "strato" ? "20%" : "39%"} </span>with the
          Yearly subscription
        </p>

        <div className="buttons">
          <button
            className={premiumDuration == "monthly" ? "sel_duration" : ""}
            onClick={() => setPremiumDuration("monthly")}
          >
            Monthly
          </button>
          <button
            className={premiumDuration == "yearly" ? "sel_duration" : ""}
            onClick={() => setPremiumDuration("yearly")}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="actions">
        <button
          className={selectPreium == "telegram" ? "disabled" : ""}
          onClick={() => setSelectPremium("strato")}
        >
          Sphere
          <QuickActions
            width={12}
            height={12}
            color={
              selectPreium == "strato"
                ? colors.textprimary
                : colors.textsecondary
            }
          />
        </button>

        <button
          className={selectPreium == "strato" ? "disabled" : ""}
          onClick={() => setSelectPremium("telegram")}
        >
          Telegram
          <Telegram
            width={12}
            height={12}
            color={
              selectPreium == "telegram"
                ? colors.textprimary
                : colors.textsecondary
            }
          />
        </button>
      </div>

      {selectPreium == "strato" && (
        <div className="benefits">
          <div>
            <CheckAlt color={colors.success} />
            <p>
              Multiple Addresses
              <span>Get multiple adresses per chain for improved security</span>
            </p>
          </div>
          <div>
            <CheckAlt color={colors.success} />
            <p>
              Advanced Recovery
              <span>Access additional account recovery methods</span>
            </p>
          </div>
          <div>
            <CheckAlt color={colors.success} />
            <p>
              StratoSphere Permit
              <span>Give others access to your StratoSphere Id</span>
            </p>
          </div>
          <div>
            <CheckAlt color={colors.success} />
            <p>
              Node Selection
              <span>Chose the nodes where your keys will be stored</span>
            </p>
          </div>
          <div>
            <CheckAlt color={colors.success} />
            <p>
              Enhanced Key Splitting
              <span>
                Increase the threshold of your key shards (upto 7 shards)
              </span>
            </p>
          </div>
        </div>
      )}

      {selectPreium == "telegram" && (
        <div className="tgbenefits">
          <p>Get Telegram premium using your crypto & fiat balances</p>
          <span>
            <Telegram color={colors.textprimary} />
            Premium
          </span>
        </div>
      )}

      <button className="onsubscribe" onClick={onSubscribe}>
        {selectPreium == "strato"
          ? "Get Sphere Premium"
          : "Get Telegram Premium"}

        {selectPreium == "strato" ? (
          <QuickActions width={12} height={12} color={colors.textprimary} />
        ) : (
          <Telegram width={16} height={16} color={colors.textprimary} />
        )}
      </button>
    </section>
  );
}
