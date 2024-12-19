import { JSX } from "@emotion/react/jsx-runtime";
import { useAppDrawer } from "../../hooks/drawer";
import { Telegram, Send } from "../../assets/icons";
import { colors } from "../../constants";
import ethereumlogo from "../../assets/images/eth.png";
import sharewallet from "../../assets/images/sharewallet.png";
import "../../styles/components/spendoptions.css";

// send from balance or generate redeemable link
export const SendOptions = (): JSX.Element => {
  const { openAppDrawer, closeAppDrawer } = useAppDrawer();

  const onSend = () => {
    closeAppDrawer();

    setTimeout(() => {
      openAppDrawer("send");
    }, 200);
  };

  const onShare = () => {
    closeAppDrawer();

    setTimeout(() => {
      openAppDrawer("share");
    }, 200);
  };

  return (
    <div id="sendoptions">
      <div className="imgs">
        <img src={ethereumlogo} alt="ethereum" />
        <div className="divider" />
        <img src={sharewallet} alt="share wallet" />
      </div>

      <p className="description">
        You can send crypto from your wallet balance or send via Telegram
      </p>

      <div className="buttons">
        <button onClick={onSend} className="usebal">
          Send From Your Balance <Send color={colors.textprimary} />
        </button>
        <button onClick={onShare}>
          Send Via Telegram <Telegram color={colors.textprimary} />
        </button>
      </div>
    </div>
  );
};
