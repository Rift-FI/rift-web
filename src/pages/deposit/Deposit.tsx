import { JSX, useState } from "react";
import { useNavigate } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { colors } from "../../constants";
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
        <button
          className={depositTarget == "me" ? "_select_target" : ""}
          disabled={depositMethod == "external"}
          onClick={() => setDepositTarget("me")}
        >
          My Account
        </button>
        <button
          className={depositTarget == "other" ? "_select_target" : ""}
          disabled={depositMethod == "external"}
          onClick={() => setDepositTarget("other")}
        >
          Another Account
        </button>
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

      <button className="deposit_btn" onClick={onDeposit}>
        Deposit Now
      </button>
    </section>
  );
}
