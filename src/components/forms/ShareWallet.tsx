import { JSX, useState } from "react";
import { TextField, Slider } from "@mui/material";
import { useLaunchParams, openTelegramLink } from "@telegram-apps/sdk-react";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { Loading } from "../../assets/animations";
import { shareWalletAccess } from "../../utils/api/wallet";
import { Share } from "../../assets/icons";
import { colors } from "../../constants";
import sharewallet from "../../assets/images/sharewallet.png";
import "../../styles/components/forms.css";

// authorise spend
export const ShareWallet = (): JSX.Element => {
  const { initData } = useLaunchParams();

  const { showerrorsnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  const [accessAmnt, setAccessAmnt] = useState<string>("");
  const [time, setTime] = useState<number>(30);
  const [processing, setProcessing] = useState<boolean>(false);

  const marks = [
    { value: 30, label: "30" },
    { value: 60, label: "60" },
    { value: 90, label: "90" },
  ];

  const handleChange = (_event: Event, newValue: number | number[]) => {
    setTime(newValue as number);
  };

  const errorInEthValue = (): boolean => {
    if (Number.isInteger(Number(accessAmnt))) return false;
    else if (accessAmnt.split(".")[1].length > 5) return true;
    else return false;
  };

  const onShareWallet = async () => {
    if (accessAmnt == "" || errorInEthValue()) {
      showerrorsnack(`Enter a valid amount`);
    } else {
      setProcessing(true);

      let access = localStorage.getItem("token");

      const { token } = await shareWalletAccess(
        access as string,
        `${time}m`,
        accessAmnt
      );

      if (token) {
        closeAppDrawer();

        openTelegramLink(
          `https://t.me/share/url?url=${token}&text=Click to collect ${accessAmnt} ETH from ${initData?.user?.username}`
        );
      } else {
        showerrorsnack(
          "Failed to generate shareable link, please try again..."
        );
      }

      setProcessing(false);
    }
  };

  return (
    <div id="sharewalletaccess">
      <img src={sharewallet} alt="share wallet" />

      <p>
        Create a link that allows another user to collect crypto from your
        wallet within a specified amount of time
      </p>

      <TextField
        value={accessAmnt}
        onChange={(ev) => setAccessAmnt(ev.target.value)}
        onKeyUp={() => errorInEthValue()}
        error={errorInEthValue()}
        label="Amount"
        placeholder="0.5"
        fullWidth
        variant="standard"
        autoComplete="off"
        type="number"
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

      <button disabled={processing} onClick={onShareWallet}>
        {processing ? (
          <Loading width="1.5rem" height="1.5rem" />
        ) : (
          <>
            Create Link <Share color={colors.textprimary} />
          </>
        )}
      </button>
    </div>
  );
};
