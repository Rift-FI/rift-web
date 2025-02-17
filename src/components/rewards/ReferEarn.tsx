import { JSX, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { openTelegramLink } from "@telegram-apps/sdk-react";
import { useSnackbar } from "../../hooks/snackbar";
import { createReferralLink } from "../../utils/api/refer";
import "../../styles/components/rewards/referean.scss";
import { Copy, Telegram } from "../../assets/icons/actions";
import { colors } from "../../constants";

export const ReferEarn = (): JSX.Element => {
  const { showsuccesssnack } = useSnackbar();

  const {
    data: referLink,
    mutate,
    isPending,
  } = useMutation({
    mutationFn: () => createReferralLink("unlock"),
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

  return (
    <div className="referearn">
      <p className="title_desc">
        Refer & Earn <span>Invite your friends to Sphere and get rewarded</span>{" "}
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
            <Copy width={12} height={14} color={colors.textsecondary} />
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
        Each successfull referral earns you and your friend 1 OM 🚀
      </p>
    </div>
  );
};
