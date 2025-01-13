import { JSX } from "react";
import { useNavigate } from "react-router";
import { useAppDrawer } from "../../hooks/drawer";
import { useTabs } from "../../hooks/tabs";
import { Market } from "../../assets/icons";
import { colors } from "../../constants";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import referearn from "../../assets/images/refer.png";
import "../../styles/components/drawer/quickactions.css";

export const QuickActions = (): JSX.Element => {
  const navigate = useNavigate();
  const { closeAppDrawer } = useAppDrawer();
  const { switchtab } = useTabs();

  const goToMarket = () => {
    closeAppDrawer();
    switchtab("market");
  };

  const sendBtc = () => {
    closeAppDrawer();
    navigate("/send-btc");
  };

  const sendEth = () => {
    closeAppDrawer();
    navigate("/eth-asset");
  };

  const sendUsdc = () => {
    closeAppDrawer();
    navigate("/send-usdc");
  };

  const onRefer = () => {
    closeAppDrawer();
    navigate("/refer");
  };

  return (
    <div className="quickactions">
      <p className="title">Quick Actions</p>

      <div className="parent f_parent" onClick={goToMarket}>
        <span className="img">
          <Market width={18} height={18} color={colors.textsecondary} />
        </span>

        <div className="child">
          <p>Marketplace</p>
          <span>View our crypto marketplace</span>
        </div>
      </div>

      <div className="parent" onClick={sendBtc}>
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

      <div className="parent" onClick={sendUsdc}>
        <img src={usdclogo} alt="usdc" />

        <div className="child">
          <p>Send USDC</p>
          <span>Send USDC directly to another address</span>
        </div>
      </div>

      <div className="parent" onClick={onRefer}>
        <img src={referearn} alt="refer" />

        <div className="child">
          <p>Refer & Earn</p>
          <span>Invite friends and earn USDC</span>
        </div>
      </div>
    </div>
  );
};
