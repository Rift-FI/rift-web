import { JSX } from "react";
import { useNavigate } from "react-router";
import { useAppDrawer } from "../../hooks/drawer";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import mantralogo from "../../assets/images/labs/mantralogo.jpeg";
import lendearn from "../../assets/images/icons/lendto.png";
import "../../styles/components/drawer/quickactions.scss";

export const QuickActions = (): JSX.Element => {
  const navigate = useNavigate();
  const { closeAppDrawer } = useAppDrawer();

  const sendBtc = () => {
    closeAppDrawer();
    navigate("/send-btc/send");
  };

  const sendEth = () => {
    closeAppDrawer();
    navigate("/eth-asset/send");
  };

  const getMantra = () => {
    closeAppDrawer();
    navigate("/get-om");
  };

  const onLendEarn = () => {
    closeAppDrawer();
    navigate("/lend");
  };

  return (
    <div className="quickactions">
      {/* <p className="title">Quick Actions</p> */}

      <div className="parent f_parent mantra" onClick={getMantra}>
        <img src={mantralogo} alt="mantra" />

        <div className="child">
          <p>Get OM</p>
          <span>Buy OM using Eth, USD or HKD</span>
        </div>
      </div>

      <div className="parent " onClick={sendBtc}>
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

      <div className="parent last_parent" onClick={onLendEarn}>
        <img src={lendearn} alt="lend to spend/earn" />

        <div className="child">
          <p>Lend & Earn</p>
          <span>Allow others to use your crypto assets and secrets</span>
        </div>
      </div>
    </div>
  );
};
