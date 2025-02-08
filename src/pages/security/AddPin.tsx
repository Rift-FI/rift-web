import { JSX, useEffect, useState } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { useTabs } from "../../hooks/tabs";
import { useSnackbar } from "../../hooks/snackbar";
import { DigitsInput } from "../../components/security/DigitsInput";
import { Lock } from "../../assets/icons/actions";
import { colors } from "../../constants";
import password from "../../assets/images/icons/password.png";
import "../../styles/pages/security/addpin.scss";

export default function AddPin(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { showerrorsnack, showsuccesssnack } = useSnackbar();

  const [pinSubmitted, setPinSubmitted] = useState<boolean>(false);
  const [pinVals, setPinVals] = useState<string>("");
  const [repeatPinVals, setRepeatPinVals] = useState<string>("");

  const userhaspin = localStorage.getItem("userhaspin");

  const goBack = () => {
    switchtab("security");
    navigate("/app");
  };

  const onSubmitPin = () => {
    if (pinVals.length < 4) {
      showerrorsnack("Please enter at four values");
    } else {
      showsuccesssnack("Retype your PIN to confirm");
      setPinSubmitted(true);
    }
  };

  const onConfirmPin = () => {
    if (pinVals === repeatPinVals) {
      showsuccesssnack(
        userhaspin == null
          ? "Your PIN was set successfully"
          : "Your PIN was updated successfully"
      );
      localStorage.setItem("userhaspin", "true");
      goBack();
    } else {
      showerrorsnack("PIN does not match, please try again");
    }
  };

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(goBack);
    }

    return () => {
      backButton.offClick(goBack);
      backButton.unmount();
    };
  }, []);

  return (
    <section id="addpin">
      <p className="title">
        Secure Your Account
        <span className="desc">
          Setup a PIN for your account to protect your transactions
        </span>
      </p>

      <div className="img">
        <img src={password} alt="PIN" />

        <p>* Your PIN must be at least 4 digits</p>
        <p>* Avoid using easily guessable numbers like "1234"</p>
      </div>

      <div className="form">
        {pinSubmitted ? (
          <DigitsInput
            setDigitVals={setRepeatPinVals}
            message="Please retype your PIN to confirm"
            clearInputs
          />
        ) : (
          <DigitsInput
            setDigitVals={setPinVals}
            message="Please Enter Your PIN"
          />
        )}

        <button
          className="submitpin"
          onClick={pinSubmitted ? onConfirmPin : onSubmitPin}
        >
          {pinSubmitted ? "Confirm My PIN" : "Save My PIN"}{" "}
          <Lock color={colors.textprimary} />
        </button>
      </div>
    </section>
  );
}
