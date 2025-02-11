import { JSX } from "react";
import { useNavigate } from "react-router";
import { useAppDrawer } from "../../hooks/drawer";
import { colors } from "../../constants";
import { Share, Stake } from "../../assets/icons/actions";
import "../../styles/components/drawer/secretactions.scss";

export const SecretActions = (): JSX.Element => {
  const navigate = useNavigate();
  const { keyToshare, secretPurpose, closeAppDrawer } = useAppDrawer();

  const onUseSecret = () => {
    // navigate to chatbot / get airwallex balances
    if (secretPurpose == "OPENAI") {
      closeAppDrawer();
      navigate(`/chatwithbot/${keyToshare}`);
    } else {
      closeAppDrawer();
    }
  };

  const onShareSecret = () => {
    const secret_type =
      secretPurpose == "OPENAI"
        ? "POE"
        : secretPurpose == "SPHERE"
        ? "SPHERE"
        : "AIRWALLEX";

    navigate(`/lend/secret/${secret_type}`);
    closeAppDrawer();
  };

  return (
    <div className="secretactions">
      <p className="_title">Lend & Use</p>
      <p className="_desc">
        You can lend or use your&nbsp;
        <span>
          {secretPurpose == "OPENAI"
            ? "Poe key"
            : secretPurpose == "SPHERE"
            ? "Sphere ID"
            : "Airwallex key"}
        </span>
      </p>

      <div className="actions">
        <button
          style={{
            color:
              secretPurpose == "SPHERE" || secretPurpose == "AIRWALLEX"
                ? colors.textsecondary
                : "",
          }}
          disabled={secretPurpose == "SPHERE" || secretPurpose == "AIRWALLEX"}
          onClick={onUseSecret}
        >
          <span>
            Use
            <Stake
              width={6}
              height={11}
              color={
                secretPurpose == "SPHERE" || secretPurpose == "AIRWALLEX"
                  ? colors.textsecondary
                  : colors.textprimary
              }
            />
          </span>

          {secretPurpose == "OPENAI"
            ? "Access a Poe chat interafce"
            : secretPurpose == "SPHERE"
            ? "Your Sphere Id"
            : "Access your Airwallex balances"}
        </button>

        <div className="divider" />

        <button onClick={onShareSecret}>
          <span>
            Lend <Share width={10} height={14} color={colors.textprimary} />
          </span>
          Lend your&nbsp;
          {secretPurpose == "OPENAI"
            ? "Poe key"
            : secretPurpose == "SPHERE"
            ? "Sphere Id"
            : "Airwallex key & balances"}
        </button>
      </div>
    </div>
  );
};
