import { JSX, useCallback, useEffect, useState } from "react";
import { TextField, Slider } from "@mui/material";
import { useLaunchParams, openTelegramLink } from "@telegram-apps/sdk-react";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { Loading } from "../../assets/animations";
import { walletBalance, shareWalletAccess } from "../../utils/api/wallet";
import { getEthUsdVal } from "../../utils/ethusd";
import { formatUsd } from "../../utils/formatters";
import { Share } from "../../assets/icons";
import { colors } from "../../constants";
import sharewallet from "../../assets/images/sharewallet.png";
import "../../styles/components/forms.css";

// authorise spend
export const ShareWallet = (): JSX.Element => {
  const { initData } = useLaunchParams();

  const { showerrorsnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  const [accBalLoading, setAccBalLoading] = useState<boolean>(false);
  const [balInUsd, setBalInUsd] = useState<number>(0.0);
  const [ethValinUSd, setEthValinUSd] = useState<number>(0.0);
  //
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
    // if (Number.isInteger(Number(accessAmnt))) return false;
    if (!accBalLoading && Number(accessAmnt) > balInUsd) return true;
    else return false;
  };

  // get wallet balance
  // convert wallet balance to usd
  // check if entered amount <= amount wallet in usd
  // open to collect {x} usd amount from {username}
  const getWalletBalance = useCallback(async () => {
    setAccBalLoading(true);

    let access: string | null = localStorage.getItem("token");

    const { balance } = await walletBalance(access as string);
    const { ethInUSD, ethValue } = await getEthUsdVal(Number(balance));

    setBalInUsd(ethInUSD);
    setEthValinUSd(ethValue);

    setAccBalLoading(false);
  }, []);

  const onShareWallet = async () => {
    if (accessAmnt == "" || errorInEthValue()) {
      showerrorsnack(`Enter a valid amount`);
    } else {
      setProcessing(true);

      let access = localStorage.getItem("token");
      let usdAmountInETH: number = Number(accessAmnt) / ethValinUSd;

      const { token } = await shareWalletAccess(
        access as string,
        `${time}m`,
        String(usdAmountInETH)
      );

      if (token) {
        closeAppDrawer();

        openTelegramLink(
          `https://t.me/share/url?url=${token}&text=Click to collect ${accessAmnt} USD from ${initData?.user?.username}`
        );
      } else {
        showerrorsnack(
          "Failed to generate shareable link, please try again..."
        );
      }

      setProcessing(false);
    }
  };

  useEffect(() => {
    getWalletBalance();
  }, []);

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
        label="Amount In USD"
        placeholder="1.0"
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
      <p className="usd_balance">
        <span className="my_bal">Your Balance</span> <br />
        {accBalLoading ? "- - -" : formatUsd(balInUsd)}
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

      <button disabled={accBalLoading || processing} onClick={onShareWallet}>
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
