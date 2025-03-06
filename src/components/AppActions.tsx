import { JSX } from "react";
import { useNavigate } from "react-router";
import { useTabs } from "../hooks/tabs";
import { Send, Add, Swap, Premium } from "../assets/icons/actions";
import { colors } from "../constants";
import "../styles/components/appactions.scss";

export const AppActions = (): JSX.Element => {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const onSendCrypto = () => {
    switchtab("sendcrypto");
  };

  const onDeposit = () => {
    switchtab("deposit");
  };

  const onSwap = () => {
    switchtab("swap");
  };

  const onPremium = () => {
    navigate("/premiums");
  };

  return (
    <div className="app-actions">
      <button className="action-btn" onClick={onSendCrypto}>
        <div className="icon-container">
          <Send width={20} height={20} color={colors.textprimary} />
        </div>
        <span className="action-label">Send</span>
      </button>

      <button className="action-btn" onClick={onDeposit}>
        <div className="icon-container">
          <Add width={20} height={20} color={colors.textprimary} />
        </div>
        <span className="action-label">Receive</span>
      </button>

      <button className="action-btn" onClick={onSwap}>
        <div className="icon-container">
          <Swap width={20} height={20} color={colors.textprimary} />
        </div>
        <span className="action-label">Swap</span>
      </button>

      <button className="action-btn" onClick={onPremium}>
        <div className="icon-container">
          <Premium width={20} height={20} color={colors.textprimary} />
        </div>
        <span className="action-label">Premium</span>
      </button>
    </div>
  );
} 