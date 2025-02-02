import { JSX, useEffect } from "react";
import { openTelegramLink, backButton } from "@telegram-apps/sdk-react";
import { useNavigate, useParams } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { useSnackbar } from "../hooks/snackbar";
import { useTabs } from "../hooks/tabs";
import { createReferralLink } from "../utils/api/refer";
import { Copy, Telegram } from "../assets/icons";
import { colors } from "../constants";
import refer from "../assets/images/refer.png";
import "../styles/pages/referral.scss";

export default function Referral(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { intent } = useParams();
  //extract if it was to unlock
  const goBack = () => {
    switchtab("profile");
    navigate(-1);
  };

  const { showsuccesssnack } = useSnackbar();

  const {
    data: referLink,
    mutate,
    isPending,
  } = useMutation({
    mutationFn: () => createReferralLink(intent),
  });

  const onCopyLink = () => {
    navigator.clipboard.writeText(referLink as string);
    showsuccesssnack("Link copied to clipboard...");
  };

  const onShareTg = () => {
    openTelegramLink(`https://t.me/share/url?url=${referLink}`);
  };

  useEffect(() => {
    mutate();
  }, []);

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(goBack);
    }

    return () => {
      backButton.offClick(goBack);
      backButton.unmount();
    };
  }, []);

  return (
    <section id="referral">
      <div className="l1">
        <img src={refer} alt="refer" />
        <p className="title">Refer and earn</p>
        <p className="desc">
          Earn USDC by inviting your friends to StratoSphereID
        </p>
      </div>

      <p className="earns">
        You have earned
        <span>0 USDC </span>
      </p>

      <div className="actions">
        <p className="genlink">
          {isPending
            ? "Generating your unique link, please wait..."
            : "Your link is ready to share 🔗"}
        </p>

        <button
          className="copylink"
          disabled={isPending || referLink == ""}
          onClick={onCopyLink}
        >
          {isPending
            ? "Generating link, please wait..."
            : referLink?.substring(0, 31) + "..."}
          <span>
            Copy
            <Copy width={12} height={14} color={colors.textprimary} />
          </span>
        </button>
        <button
          className="send_tg"
          disabled={isPending || referLink == ""}
          onClick={onShareTg}
        >
          Share On Telegram
          <Telegram width={18} height={18} color={colors.textprimary} />
        </button>
      </div>

      <p className="mindesc">
        For each successfull referral, you get 1 USDC 🚀
      </p>
    </section>
  );
}
