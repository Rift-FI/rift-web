import { JSX, useState } from "react";
import { faWallet } from "@fortawesome/free-solid-svg-icons";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { OutlinedTextInput } from "../global/Inputs";
import { SubmitButton } from "../global/Buttons";
import { FaIcon } from "../../assets/faicon";
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

      <OutlinedTextInput
        inputType="number"
        placeholder="20,000 HKD"
        inputlabalel="Daily Transaction Limit (HKD)"
        inputState={txLimit}
        setInputState={setTxLimit}
        autofocus
      />

      <SubmitButton
        text="Save Limit"
        icon={<FaIcon faIcon={faWallet} color={colors.primary} />}
        sxstyles={{ gap: "0.5rem", marginTop: "1rem" }}
        onclick={onSubmit}
      />
    </div>
  );
};
