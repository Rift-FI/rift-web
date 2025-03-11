import { JSX, useState } from "react";
import { useNavigate } from "react-router";
import { faAt } from "@fortawesome/free-solid-svg-icons";
import { useBackButton } from "../../hooks/backbutton";
import { useSnackbar } from "../../hooks/snackbar";
import { SubmitButton } from "../../components/global/Buttons";
import { DigitsInput } from "../../components/security/DigitsInput";
import { OutlinedTextInput } from "../../components/global/Inputs";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import emailaddr from "../../assets/images/icons/email.png";
import "../../styles/pages/security/addemail.scss";

export default function AddEmail(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();

  const [emailEntered, setEmailEntered] = useState<boolean>(false);
  const [otpEntered, setOtpEntered] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [otpVals, setOtpVals] = useState<string>("");

  const goBack = () => {
    navigate("/security/recover");
  };

  const onSubmitEmailAddr = () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (userEmail == "" || !emailRegex.test(userEmail)) {
      showerrorsnack("Please enter a valid email address");
    } else {
      setEmailEntered(true);
    }
  };

  const onSubmitOtp = () => {
    if (otpVals.length < 4) {
      showerrorsnack("Please enter the OTP we sent you");
    } else {
      setOtpEntered(true);
      showsuccesssnack("Your Email Address was updated successfully");
      localStorage.setItem("useremail", userEmail);

      setTimeout(() => {
        goBack();
      }, 800);
    }
  };

  useBackButton(goBack);

  return (
    <section id="addemail">
      <p className="title">
        Email Address
        <span className="desc">
          Add an Email Address you can use to recover your account
        </span>
      </p>

      <div className="img">
        <img src={emailaddr} alt="email" />

        <p>* Use a valid Email Address</p>
        <p>* We will send you an OTP to verify</p>
      </div>

      <div className="progressctr">
        <div
          style={{ width: emailEntered ? "50%" : otpEntered ? "100%" : "" }}
          className="progress"
        />
        <p className="progresscount">
          {emailEntered
            ? "Almost there, Verify your email with the OTP we sent you"
            : "Enter Your Email Adrress"}
        </p>
      </div>

      <div className="form">
        {emailEntered ? (
          <DigitsInput
            setDigitVals={setOtpVals}
            message="Verify your email with the OTP we sent you"
          />
        ) : (
          <OutlinedTextInput
            inputType="email"
            placeholder="your-email@domain.com"
            inputlabalel="Email Address"
            inputState={userEmail}
            setInputState={setUserEmail}
          />
        )}

        <SubmitButton
          text={emailEntered ? "Verify Email Address" : "Save Email"}
          icon={<FaIcon faIcon={faAt} color={colors.textprimary} />}
          sxstyles={{ marginTop: "2rem" }}
          onclick={emailEntered ? onSubmitOtp : onSubmitEmailAddr}
        />
      </div>
    </section>
  );
}
