import { JSX, useState } from "react";
import { useNavigate } from "react-router";
import { useBackButton } from "../hooks/backbutton";
import { useTabs } from "../hooks/tabs";
import { formatUsd } from "../utils/formatters";
import { SubmitButton } from "../components/global/Buttons";
import { colors } from "../constants";
import { Premium as PremiumAnimation } from "../assets/animations";
import { CheckAlt, QuickActions } from "../assets/icons/actions";
import "../styles/pages/premiums.scss";

export default function Premium(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const [premiumDuration, setPremiumDuration] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  const onSubscribe = () => {
    navigate("/premiums/sphere");
  };

  useBackButton(goBack);

  return (
    <section id="premium">
      <div className="img">
        <PremiumAnimation width="12rem" height="12rem" />
      </div>

      <p className="_title">Premium</p>

      <div className="duration">
        <p className="cost">
          {premiumDuration == "monthly" ? formatUsd(6.05) : formatUsd(57.99)}
          &nbsp;
          <span>/ {premiumDuration == "monthly" ? "month" : "year"}</span>
        </p>

        <p className="save">
          Save <span>20%</span> with the Yearly subscription
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

      <div className="benefits">
        <PremiumFeature
          title="Telegram Premium"
          description="Experience Telegram Premium at 50% off"
          price={1.99}
        />

        <PremiumFeature
          title="Multiple Addresses"
          description="Get multiple adresses per chain for improved security"
          price={0.75}
        />

        <PremiumFeature
          title="Advanced Recovery"
          description="Access additional account recovery methods"
          price={0.75}
        />

        <PremiumFeature
          title="Sphere Permit"
          description="Give others access to your StratoSphere Id"
          price={0.85}
        />

        <PremiumFeature
          title="Node Selection"
          description="Chose the nodes where your keys will be stored"
          price={0.85}
        />

        <PremiumFeature
          title="Enhanced Key Splitting"
          description="Increase the threshold of your key shards (upto 7 shards)"
          price={0.85}
        />
      </div>

      <SubmitButton
        text="Get Sphere Premium"
        icon={
          <QuickActions width={12} height={12} color={colors.textprimary} />
        }
        sxstyles={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          gap: "0.5rem",
          height: "2.65rem",
          borderRadius: 0,
        }}
        onclick={onSubscribe}
      />
    </section>
  );
}

const PremiumFeature = ({
  title,
  description,
  price,
}: {
  title: string;
  description: string;
  price: number;
}): JSX.Element => {
  return (
    <div>
      <CheckAlt color={colors.success} />

      <p>
        {title} · {formatUsd(price)}
        <span>{description}</span>
      </p>
    </div>
  );
};
