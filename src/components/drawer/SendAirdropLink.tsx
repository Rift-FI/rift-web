import { JSX } from "react";
import { openTelegramLink } from "@telegram-apps/sdk-react";
import { useAppDrawer } from "../../hooks/drawer";
import { useSnackbar } from "../../hooks/snackbar";
import { SubmitButton } from "../global/Buttons";
import { Copy, Telegram } from "../../assets/icons/actions";
import { colors } from "../../constants";
import "../../styles/components/drawer/sendairdroplink.scss";

export const SendAirdropLink = (): JSX.Element => {
  const { closeAppDrawer, linkUrl } = useAppDrawer();
  const { showsuccesssnack } = useSnackbar();

  const onCopyLink = () => {
    navigator.clipboard.writeText(linkUrl as string);
    showsuccesssnack("Link copied to clipboard...");
  };

  const onShareTg = () => {
    closeAppDrawer();
    openTelegramLink(
      `https://t.me/share/url?url=${linkUrl}&text=Claim airdrop tokens from my campaign on StratoSphereId`
    );
  };

  return (
    <div id="sendairdroplink">
      <p className="sendtitle">Your campaign was created successfully</p>
      <p className="senddesc">Here's the airdrop link for you to share 🔗</p>

      <div className="actions">
        <button className="copylink" onClick={onCopyLink}>
          {linkUrl?.substring(0, 31) + "..."}
          <span>
            Copy
            <Copy width={12} height={14} color={colors.textsecondary} />
          </span>
        </button>

        <SubmitButton
          text="Share On Telegram"
          icon={<Telegram width={18} height={18} color={colors.textprimary} />}
          sxstyles={{ marginTop: "0.625rem", padding: "0.625rem" }}
          onclick={onShareTg}
        />
      </div>

      <p className="mindesc">
        Share the link with others for them to claim tokens from your campaign
      </p>
    </div>
  );
};
