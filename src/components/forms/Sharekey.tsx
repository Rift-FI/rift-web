import { JSX, useState } from "react";
import { TextField, Slider } from "@mui/material";
import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
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
  const { closeAppDrawer, secretPurpose } = useAppDrawer();

  const [keytargetusr, setkeytargetusr] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [time, setTime] = useState<number>(30);

  const marks = [
    { value: 30, label: "30" },
    { value: 60, label: "60" },
    { value: 90, label: "90" },
  ];

  const handleChange = (_event: Event, newValue: number | number[]) => {
    setTime(newValue as number);
  };

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
        `${time}m`,
        keytargetusr,
        secretPurpose as string
      );

      if (isOk) {
        showsuccesssnack("Key was shared successfully");
        closeAppDrawer();
      } else {
        showerrorsnack("An unexpected error occurred");
      }

      setProcessing(false);
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

      <p className="timevalidlabel">Valid for ({time} minutes)</p>
      <Slider
        value={time}
        onChange={handleChange}
        marks={marks}
        step={null}
        min={30}
        max={90}
        valueLabelDisplay="on"
        slotProps={{ valueLabel: { style: { color: colors.textprimary } } }}
        sx={{
          marginTop: "1.5rem",
          "& .MuiSlider-markLabel": {
            fontSize: "0.75rem",
            color: colors.textprimary,
          },
          "& .MuiSlider-thumb": {
            backgroundColor: colors.accent,
          },
          "& .MuiSlider-track": {
            backgroundColor: colors.accent,
          },
          "& .MuiSlider-rail": {
            backgroundColor: colors.textsecondary,
          },
          "& .MuiSlider-valueLabel": {
            fontSize: "0.625rem",
            color: colors.textprimary,
            backgroundColor: colors.accent,
          },
        }}
      />

      <button
        disabled={processing}
        className="submitlogin"
        onClick={onShareKey}
      >
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
