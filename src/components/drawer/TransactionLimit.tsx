import { JSX, useState } from "react";
import { TextField } from "@mui/material";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { Wallet } from "../../assets/icons/security";
import { colors } from "../../constants";
import "../../styles/components/drawer/transactionlimit.scss";

export const TransactionLimit = (): JSX.Element => {
  const { showerrorsnack, showsuccesssnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  const [txLimit, setTxLimit] = useState<string>("");

  const onSubmit = () => {
    if (txLimit == "") {
      showerrorsnack("Please enter a transaction limit...");
    } else {
      localStorage.setItem("txlimit", txLimit);
      showsuccesssnack("Transaction limit was updated successfully");
      closeAppDrawer();
    }
  };

  return (
    <div className="transactionlimit">
      <p className="title">
        Daily Transaction Limit
        <span>
          Set a daily spending limit to stay in control of your transactions.
          Once the limit is reached, further transactions will be restricted for
          the day.
        </span>
      </p>

      <TextField
        value={txLimit}
        onChange={(ev) => setTxLimit(ev.target.value)}
        label="Daily Transaction Limit (HKD)"
        placeholder="20,000 HKD"
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

      <button className="submitlimit" onClick={onSubmit}>
        Save Limit
        <Wallet width={20} height={18} color={colors.textprimary} />
      </button>
    </div>
  );
};
