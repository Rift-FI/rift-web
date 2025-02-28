import { CSSProperties, JSX, useState } from "react";
import { useNavigate } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { SubmitButton } from "../../components/global/Buttons";
import { colors } from "../../constants";
import { Send } from "../../assets/icons/actions";
import "../../styles/pages/deposit/deposit.scss";

export default function Deposit(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const [depositTarget, setDepositTarget] = useState<"me" | "other">("me");
  const [depositMethod, setDepositMethod] = useState<"airwallex" | "external">(
    "airwallex"
  );

  const onDeposit = () => {
    if (depositMethod == "external") {
      navigate("/deposit-address");
    } else {
      navigate(`/deposit-awx/${depositTarget}`);
    }
  };

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  useBackButton(goBack);

  return (
    <section id="deposit">
      <p className="title_desc">
        Choose a deposit target
        <span>Where would you like to deposit funds ?</span>
      </p>

      <div className="targtes">
        <SubmitButton
          text="My Account"
          sxstyles={{
            ...buttonstyles,
            color: depositTarget == "me" ? colors.primary : colors.textprimary,
            backgroundColor:
              depositTarget == "me" ? colors.textprimary : "transparent",
          }}
          isDisabled={depositMethod == "external"}
          onclick={() => setDepositTarget("me")}
        />

        <SubmitButton
          text="Another Account"
          sxstyles={{
            ...buttonstyles,
            color:
              depositTarget == "other" ? colors.primary : colors.textprimary,
            backgroundColor:
              depositTarget == "other" ? colors.textprimary : "transparent",
          }}
          isDisabled={depositMethod == "external"}
          onclick={() => setDepositTarget("other")}
        />
      </div>

      <p className="title_desc">
        Choose a deposit method
        <span>How would you like to deposit funds ?</span>
      </p>

      <div className="methods">
        <div className="util" onClick={() => setDepositMethod("airwallex")}>
          <div className="radioctr">
            <div
              style={{
                backgroundColor:
                  depositMethod == "airwallex"
                    ? colors.textprimary
                    : colors.primary,
              }}
            />
          </div>

          <p className="purpose">
            Airwallex
            <span>Deposit from your Airwallex balances</span>
          </p>
        </div>

        <div
          className="util"
          onClick={() => {
            setDepositMethod("external");
            setDepositTarget("me");
          }}
        >
          <div className="radioctr">
            <div
              style={{
                backgroundColor:
                  depositMethod == "external"
                    ? colors.textprimary
                    : colors.primary,
              }}
            />
          </div>

          <p className="purpose">
            External Network
            <span>Deposit from an external network</span>
          </p>
        </div>
      </div>

      <SubmitButton
        text="Deposit Now"
        icon={<Send width={16} height={16} color={colors.textprimary} />}
        sxstyles={{
          width: "unset",
          position: "fixed",
          bottom: "1rem",
          left: "1rem",
          right: "1rem",
        }}
        onclick={onDeposit}
      />
    </section>
  );
}

const buttonstyles: CSSProperties = {
  width: "48%",
  padding: "0.375rem",
  borderRadius: "2rem",
  fontSize: "0.75rem",
  fontWeight: "bold",
};
