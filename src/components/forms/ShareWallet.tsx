import { JSX, useState } from "react";
import { TextField, Slider, Checkbox } from "@mui/material";
import { useLaunchParams, openTelegramLink } from "@telegram-apps/sdk-react";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { Loading } from "../../assets/animations";
import { shareWalletAccess } from "../../utils/api/wallet";
import { formatUsd } from "../../utils/formatters";
import { Telegram } from "../../assets/icons";
import { colors } from "../../constants";
import sharewallet from "../../assets/images/sharewallet.png";
import "../../styles/components/forms.css";

// authorise spend
export const ShareWallet = (): JSX.Element => {
  const { initData } = useLaunchParams();

  const { showerrorsnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  let localethBal = localStorage.getItem("ethbal");
  let localethUsdBal = localStorage.getItem("ethbalUsd");
  let localethValue = localStorage.getItem("ethvalue");

  const [accessAmnt, setAccessAmnt] = useState<string>("");
  const [ethQty, setEthQty] = useState<string>("");
  const [time, setTime] = useState<number>(30);
  const [processing, setProcessing] = useState<boolean>(false);
  const [noExpiry, setNoExpiry] = useState<boolean>(false);

  const marks = [
    { value: 30, label: "30" },
    { value: 60, label: "60" },
    { value: 90, label: "90" },
  ];

  const handleChange = (_event: Event, newValue: number | number[]) => {
    setTime(newValue as number);
  };

  const errorInUSDVal = (): boolean => {
    if (Number(accessAmnt) >= Number(localethUsdBal)) return true;
    else return false;
  };

  const onShareWallet = async () => {
    if (accessAmnt == "" || errorInUSDVal()) {
      showerrorsnack(`Enter a valid amount`);
    } else {
      setProcessing(true);

      let access = localStorage.getItem("token");
      let usdAmountInETH = (Number(accessAmnt) / Number(localethValue)).toFixed(
        5
      );

      const { token } = await shareWalletAccess(
        access as string,
        noExpiry ? "1000d" : `${time}m`,
        usdAmountInETH
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

  return (
    <div id="sharewalletaccess">
      <img src={sharewallet} alt="share wallet" />

      <p>
        Create a link that allows others to collect crypto from your wallet
        within a specified amount of time
      </p>

      <p className="usd_balance ethereum_balance">
        <span className="my_bal">Balance</span> <br />
        {Number(localethBal).toFixed(8)} ETH
      </p>

      <TextField
        value={accessAmnt == "" ? "" : ethQty}
        onChange={(ev) => {
          setEthQty(ev.target.value);
          setAccessAmnt(
            (Number(ev.target.value) * Number(localethValue)).toFixed(2)
          );
        }}
        onKeyUp={() => errorInUSDVal()}
        error={errorInUSDVal()}
        label="Quantity (ETH)"
        placeholder="0.05"
        fullWidth
        variant="standard"
        autoComplete="off"
        type="number"
        sx={{
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
        value={ethQty == "" ? "" : accessAmnt}
        onChange={(ev) => {
          setAccessAmnt(ev.target.value);
          setEthQty(
            (Number(ev.target.value) / Number(localethValue)).toFixed(5)
          );
        }}
        onKeyUp={() => errorInUSDVal()}
        error={errorInUSDVal()}
        label="Amount (USD)"
        placeholder="1.0"
        fullWidth
        variant="standard"
        autoComplete="off"
        type="number"
        sx={{
          marginTop: "0.75rem",
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
        {formatUsd(Number(localethUsdBal))}
      </p>

      <p className="timevalidlabel">
        Access Duration
        <br />
        <span>Set a time limit or select 'no expiry' for unlimited access</span>
      </p>

      <p className="valid_minutes">{time} minutes</p>
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

      <div className="noexpiry">
        <Checkbox
          checked={noExpiry}
          onChange={(e) => setNoExpiry(e.target.checked)}
          disableRipple
          sx={{
            color: colors.textsecondary,
            paddingLeft: "unset",
            "&.Mui-checked": {
              color: colors.accent,
            },
          }}
        />

        <p>
          No Expiry <br />
          <span>The link you share will not expire</span>
        </p>
      </div>

      <button disabled={processing} onClick={onShareWallet}>
        {processing ? (
          <Loading width="1.5rem" height="1.5rem" />
        ) : (
          <>
            Send <Telegram color={colors.textprimary} />
          </>
        )}
      </button>
    </div>
  );
};
