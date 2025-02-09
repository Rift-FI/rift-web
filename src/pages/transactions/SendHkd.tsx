import { JSX, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { TextField } from "@mui/material";
import { useSnackbar } from "../../hooks/snackbar";
import { formatNumber } from "../../utils/formatters";
import { colors } from "../../constants";
import { Send, Info } from "../../assets/icons/actions";
import "../../styles/pages/transaction.scss";

export default function SendHkd(): JSX.Element {
  const { balance } = useParams();
  const navigate = useNavigate();
  const { showerrorsnack } = useSnackbar();

  const backbuttonclick = () => {
    navigate(`/hkd-asset/${balance}`);
  };

  let availableBalance = balance;

  const [receipientTgUname, setReceipientTgUname] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  const errorInAmount = (): boolean => {
    if (amount == "") return false;
    else if (Number(amount) >= Number(availableBalance)) return true;
    else return false;
  };

  const onSendBtc = async () => {
    showerrorsnack("Feature coming soon");
  };

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(backbuttonclick);
    }

    return () => {
      backButton.offClick(backbuttonclick);
      backButton.unmount();
    };
  }, []);

  return (
    <div id="sendasset" className="send_fiat">
      <span className="country_flag">🇭🇰</span>

      <p className="info">
        <Info width={14} height={14} color={colors.danger} />
        Send HKD from your Airwallex balance
      </p>

      <p>
        To send HKD from your Airwallex balance, simply provide the receipient's
        Telegram username and amount.
      </p>

      <TextField
        value={receipientTgUname}
        onChange={(ev) => setReceipientTgUname(ev.target.value)}
        label={`Receipient's Telegram Username`}
        placeholder="telegram-username"
        fullWidth
        variant="outlined"
        autoComplete="off"
        type="text"
        sx={{
          marginTop: "1.5rem",
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: colors.divider,
            },
            "& input": {
              color: colors.textprimary,
            },
            "&::placeholder": {
              color: colors.textsecondary,
              opacity: 1,
            },
          },
          "& .MuiInputLabel-root": {
            color: colors.textsecondary,
            fontSize: "0.875rem",
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: colors.accent,
          },
        }}
      />

      <TextField
        value={amount}
        onChange={(ev) => setAmount(ev.target.value)}
        onKeyUp={() => errorInAmount()}
        error={errorInAmount()}
        label="Amount"
        placeholder="150"
        fullWidth
        variant="outlined"
        autoComplete="off"
        type="number"
        sx={{
          marginTop: "1.5rem",
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: colors.divider,
            },
            "& input": {
              color: colors.textprimary,
            },
            "&::placeholder": {
              color: colors.textsecondary,
              opacity: 1,
            },
          },
          "& .MuiInputLabel-root": {
            color: colors.textsecondary,
            fontSize: "0.875rem",
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: colors.accent,
          },
        }}
      />

      <p className="availablebalance">
        {formatNumber(Number(availableBalance))} HKD
      </p>

      <button
        disabled={
          receipientTgUname == "" ||
          amount == "" ||
          Number(amount) > Number(availableBalance)
        }
        onClick={onSendBtc}
      >
        Send
        <Send
          width={18}
          height={18}
          color={
            receipientTgUname == "" ||
            amount == "" ||
            Number(amount) > Number(availableBalance)
              ? colors.textsecondary
              : colors.textprimary
          }
        />
      </button>
    </div>
  );
}
