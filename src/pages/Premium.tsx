import { JSX, useEffect, useState } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { useSnackbar } from "../hooks/snackbar";
import { useTabs } from "../hooks/tabs";
import { colors } from "../constants";
import { Premium as PremiumAnimation } from "../assets/animations";
import { CheckAlt, QuickActions, Telegram } from "../assets/icons/actions";
import "../styles/pages/premiums.scss";

type premiumoptions = "telegram" | "strato";

export default function Premium(): JSX.Element {
  const navigate = useNavigate();
  const { showerrorsnack } = useSnackbar();
  const { switchtab } = useTabs();

  const [selectPreium, setSelectPremium] = useState<premiumoptions>("strato");

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  const onSubscribe = () => {
    showerrorsnack("Feature coming soon...");
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

      <p className="_title">StratoSphere Premium</p>
      <p className="_desc">
        Get StratoSphere Premium / Grant a friend Telegram Premium with your
        crypto
      </p>

      <div className="actions">
        <button
          className={selectPreium == "telegram" ? "disabled" : ""}
          onClick={() => setSelectPremium("strato")}
        >
          StratoSphere
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
          <p>
            Grant other Stratosphere users Telegram premium using your crypto
            balance
          </p>
          <span>
            <Telegram color={colors.accent} />
            Premium
          </span>
        </div>
      )}

      <button className="onsubscribe" onClick={onSubscribe}>
        {selectPreium == "strato"
          ? "Get StratoSphere Premium"
          : "Grant Telegram Premium"}

        {selectPreium == "strato" ? (
          <QuickActions width={12} height={12} color={colors.textprimary} />
        ) : (
          <Telegram width={16} height={16} color={colors.textprimary} />
        )}
      </button>
    </section>
  );
}
