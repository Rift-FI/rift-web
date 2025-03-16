import { JSX, useState } from "react";
import { faCheckCircle, faPhone } from "@fortawesome/free-solid-svg-icons";
import { useSnackbar } from "../hooks/snackbar";
import { PhoneInput } from "../components/security/PhoneInput";
import { DigitsInput } from "../components/security/DigitsInput";
import { BottomButtonContainer } from "../components/Bottom";
import { SubmitButton } from "../components/global/Buttons";
import { FaIcon } from "../assets/faicon";
import { colors } from "../constants";
import "../styles/pages/phoneauth.scss";

export default function PhoneAuth(): JSX.Element {
  const { showsuccesssnack, showerrorsnack } = useSnackbar();

  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [requestedOtp, setRequestedOtp] = useState<boolean>(false);

  const onSubmitPhoneAuth = () => {
    if (requestedOtp) {
      if (otpCode.length < 4) {
        showerrorsnack("Please enter the full OTP Code");
      } else {
        showsuccesssnack("Your phone was verified");
        setRequestedOtp(false);
      }
    } else {
      if (phoneNumber == "" || phoneNumber.length < 6) {
        showerrorsnack("Please enter a valid phone number");
      } else {
        showsuccesssnack("OTP Code sent successfully");
        setRequestedOtp(true);
      }
    }
  };

  return (
    <section id="phoneauth">
      <p className="title">
        {requestedOtp ? "Enter the OTP" : "Enter Your"}
        <br /> {requestedOtp ? "Sent to Your Phone" : "Phone Number"}
      </p>
      <span className="desc">
        {requestedOtp
          ? `We sent it to ${phoneNumber.substring(
              0,
              phoneNumber.length / 2
            )}***`
          : "We will send you an OTP to verify your phone number"}
      </span>

      {requestedOtp ? (
        <DigitsInput
          setDigitVals={setOtpCode}
          sxstyles={{ marginTop: "1rem" }}
        />
      ) : (
        <PhoneInput
          sxstyles={{ marginTop: "1rem" }}
          setPhoneVal={setPhoneNumber}
        />
      )}

      <p className="note">
        To get started with Sphere, we need to verify your account with a phone
        number
      </p>

      <BottomButtonContainer>
        <SubmitButton
          text={requestedOtp ? "Verify Phone Number" : "Get OTP"}
          icon={
            <FaIcon
              faIcon={requestedOtp ? faCheckCircle : faPhone}
              color={colors.textprimary}
            />
          }
          sxstyles={{
            gap: "0.5rem",
            padding: "0.625rem",
            borderRadius: "1.5rem",
            backgroundColor: colors.success,
          }}
          onclick={onSubmitPhoneAuth}
        />
      </BottomButtonContainer>
    </section>
  );
}
