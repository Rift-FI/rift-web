import { JSX, useState } from "react";
import { TextField, Slider } from "@mui/material";
import { useSnackbar } from "../../hooks/snackbar";
import { Loading } from "../../assets/animations";
import { shareWalletAccess } from "../../utils/api/wallet";
import { Share } from "../../assets/icons";
import { colors } from "../../constants";
import sharewallet from "../../assets/images/sharewallet.png";
import "../../styles/components/forms.css";

export const ShareWallet = (): JSX.Element => {
  const { showsuccesssnack, showerrorsnack } = useSnackbar();

  const [receiverEmail, setReceiverEmail] = useState<string>("");
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
    if (receiverEmail == "") {
      showerrorsnack(`Enter the receipient's telegram username`);
    } else {
      setProcessing(true);

      let access = localStorage.getItem("token");

      const { token } = await shareWalletAccess(
        access as string,
        `${time}m`,
        receiverEmail,
        accessAmnt
      );

      if (token) {
        navigator.clipboard.writeText(token);
        showsuccesssnack("Redeemable link copied to clipboard");
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
        You can grant others temporary access to your wallet. Just enter their
        telegram username, amount and a duration for which they can perform
        transactions on your behalf
      </p>

      <TextField
        value={receiverEmail}
        onChange={(ev) => setReceiverEmail(ev.target.value)}
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
          marginTop: "1rem",
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

      <p className="timevalidlabel">Time ({time} minutes)</p>
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
            backgroundColor: colors.accent,
            color: colors.primary,
          },
        }}
      />

      <button onClick={onShareWallet}>
        {processing ? (
          <Loading width="1.5rem" height="1.5rem" />
        ) : (
          <>
            Grant Access <Share color={colors.textprimary} />
          </>
        )}
      </button>
    </div>
  );
};
