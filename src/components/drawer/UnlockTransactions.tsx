import { JSX } from "react";
import { useNavigate } from "react-router";
import { useAppDrawer } from "../../hooks/drawer";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import "../../styles/components/drawer/unlocktransactions.scss";

export const UnlockTransactions = (): JSX.Element => {
  const navigate = useNavigate();
  const { closeAppDrawer } = useAppDrawer();

  const sendBtc = () => {
    localStorage.setItem("prev_page", "rewards");

    closeAppDrawer();
    navigate("/send-crypto/BTC/unlock");
  };

  const sendEth = () => {
    localStorage.setItem("prev_page", "rewards");

    closeAppDrawer();
    navigate("/send-crypto/ETH/unlock");
  };

  const sendUSDc = () => {
    localStorage.setItem("prev_page", "rewards");

    closeAppDrawer();
    navigate("/send-crypto/USDC/unlock");
  };

  return (
    <div id="unlocktransactions">
      <p className="title">Make a transaction</p>
      <p className="desc">Perform a transaction & unlock 1 OM</p>

      <div className="parent f_parent" onClick={sendBtc}>
        <img src={btclogo} alt="btc" />

        <div className="child">
          <p>Send BTC</p>
          <span>Send Bitcoin directly to another address</span>
        </div>
      </div>

      <div className="parent" onClick={sendEth}>
        <img src={ethlogo} alt="eth" />

        <div className="child">
          <p>Send ETH</p>
          <span>Send ETH directly to an address or via Telegram</span>
        </div>
      </div>

      <div className="parent" onClick={sendUSDc}>
        <img src={usdclogo} alt="btc" />

        <div className="child">
          <p>Send USDC</p>
          <span>Send USDC directly to another address</span>
        </div>
      </div>
    </div>
  );
};
