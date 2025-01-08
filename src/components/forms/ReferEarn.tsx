import { JSX, useCallback, useEffect, useState } from "react";
import { useSnackbar } from "../../hooks/snackbar";
import { createReferralLink } from "../../utils/api/refer";
import { openTelegramLink } from "@telegram-apps/sdk-react";
import { Copy, Telegram } from "../../assets/icons";
import { colors } from "../../constants";
import refer from "../../assets/images/refer.png";
import "../../styles/components/refer_earn.css";

export const ReferEarn = (): JSX.Element => {
  const { showsuccesssnack } = useSnackbar();

  const [processing, setProcessing] = useState<boolean>(false);
  const [referLink, setReferLink] = useState<string>("");

  const onCopyLink = () => {
    navigator.clipboard.writeText(referLink);
    showsuccesssnack("Link copied to clipboard...");
  };

  const onShareTg = () => {
    openTelegramLink(
      `https://t.me/share/url?url=${referLink}&text=Get strated with StratoSphere ID`
    );
  };

  const generateReferLink = useCallback(async () => {
    setProcessing(true);
    const link = await createReferralLink();
    if (link) {
      setReferLink(link);
      setProcessing(false);
    } else {
    }
  }, []);

  useEffect(() => {
    generateReferLink();
  }, []);

  return (
    <div id="refer_earn">
      <img src={refer} alt="refer & earn" />

      <p className="title">Refer & Earn</p>
      <p className="desc">
        Invite your friends to join Stratosphere ID and get rewarded
      </p>

      <div className="divider" />

      <p className="hiw">How it works</p>

      <div className="steps">
        <div>
          <span className="count">1</span>
          <p>
            Generate your unique referral link 🔗
            <span>We will generate a link for you</span>
          </p>
        </div>

        <div>
          <span className="count">2</span>
          <p>
            Share your link 💬
            <span>Send your referral link to your friends</span>
          </p>
        </div>

        <div>
          <span className="count">3</span>
          <p>
            Earn 🚀
            <span>You get 1 USDC for each successfull referral</span>
          </p>
        </div>
      </div>

      <div className="divider" />

      <button
        className="copylink"
        disabled={processing || referLink == ""}
        onClick={onCopyLink}
      >
        {processing
          ? "Generating link, please wait..."
          : referLink.substring(0, 31) + "..."}
        <span>
          Copy
          <Copy width={12} height={14} color={colors.textprimary} />
        </span>
      </button>
      <button
        className="send_tg"
        disabled={processing || referLink == ""}
        onClick={onShareTg}
      >
        Send Via Telegram
        <Telegram width={18} height={18} color={colors.textprimary} />
      </button>
    </div>
  );
};
