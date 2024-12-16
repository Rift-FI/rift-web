import { JSX, useState } from "react";
import { TextField } from "@mui/material";
import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { useSnackbar } from "../../hooks/snackbar";
import { ShareKeyWithOtherUser } from "../../utils/api/keys";
import { Loading } from "../../assets/animations";
import { Share } from "../../assets/icons";
import { colors } from "../../constants";
import sharekey from "../../assets/images/sharekey.png";
import "../../styles/components/forms.css";

export const ShareKey = ({
  keyToShare,
}: {
  keyToShare: string;
}): JSX.Element => {
  const { showsuccesssnack, showerrorsnack } = useSnackbar();

  const [keytargetusr, setkeytargetusr] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);

  const onShareKey = async () => {
    if (keytargetusr == "") {
      showerrorsnack(`Enter the receipient's telegram username`);
    } else {
      setProcessing(true);

      let token: string | null = localStorage.getItem("token");
      let { initData } = retrieveLaunchParams();

      const { isOk } = await ShareKeyWithOtherUser(
        token as string,
        keyToShare.substring(0, 4),
        "foreign",
        keyToShare,
        initData?.user?.username as string,
        keytargetusr
      );

      if (isOk) {
        setProcessing(false);
        showsuccesssnack("Key was shared successfully");
      } else {
        setProcessing(false);
        showerrorsnack("An unexpected error occurred");
      }
    }
  };

  return (
    <div id="authorise">
      <img src={sharekey} alt="share key" />

      <p>Share Your Key(s) by entering the other user's telegram username</p>

      <TextField
        value={keytargetusr}
        onChange={(ev) => setkeytargetusr(ev.target.value)}
        label="Telegram Username"
        placeholder="telegram-username"
        fullWidth
        variant="standard"
        autoComplete="off"
        type="email"
        sx={{
          marginTop: "1.25rem",
          "& .MuiInputBase-input": {
            color: colors.textprimary,
          },
          "& .MuiInputLabel-root": {
            color: colors.textsecondary,
          },
          "& .MuiInput-underline:before": {
            borderBottomColor: colors.textsecondary,
          },
          "& .MuiInput-underline:hover:before": {
            borderBottomColor: colors.textsecondary,
          },
          "& .MuiInput-underline:after": {
            borderBottomColor: colors.accent,
          },
        }}
      />

      <p className="keyshare">
        <span>Key</span> <br />
        {keyToShare}
      </p>

      <button className="submitlogin" onClick={onShareKey}>
        {processing ? (
          <Loading width="1.5rem" height="1.5rem" />
        ) : (
          <>
            Share
            <Share width={14} height={16} color={colors.textprimary} />
          </>
        )}
      </button>
    </div>
  );
};
