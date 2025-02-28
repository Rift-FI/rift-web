import { JSX, useState } from "react";
import { useNavigate } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { useSnackbar } from "../../hooks/snackbar";
import { PhoneInput } from "../../components/security/PhoneInput";
import { DigitsInput } from "../../components/security/DigitsInput";
import { SubmitButton } from "../../components/global/Buttons";
import { Phone } from "../../assets/icons/security";
import { colors } from "../../constants";
import otpphone from "../../assets/images/icons/phone.png";
import "../../styles/pages/security/addphone.scss";

export default function AddPhone(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();

  const [phoneEntered, setPhoneEntered] = useState<boolean>(false);
  const [otpEntered, setOtpEntered] = useState<boolean>(false);
  const [userPhone, setUserPhone] = useState<string>("");
  const [otpVals, setOtpVals] = useState<string>("");

  const goBack = () => {
    navigate("/security/recover");
  };

  const onSubmitPhone = () => {
    if (userPhone == "") {
      showerrorsnack("Enter a valid Phone Number");
    } else {
      setPhoneEntered(true);
    }
  };

  const onVerifyPhone = () => {
    if (otpVals.length < 4) {
      showerrorsnack("Please enter the OTP we sent you");
    } else {
      setOtpEntered(true);
      showsuccesssnack("Your Phone was updated successfully");
      localStorage.setItem("userphone", userPhone);

      setTimeout(() => {
        goBack();
      }, 800);
    }
  };

  useBackButton(goBack);

  return (
    <section id="addphone">
      <p className="title">
        Phone Number
        <span className="desc">
          Add an Phone Number you can use to recover your account
        </span>
      </p>

      <div className="img">
        <img src={otpphone} alt="phone" />

        <p>* Use a valid Phone Number</p>
        <p>* We will send you an OTP to verify</p>
      </div>

      <div className="progressctr">
        <div
          style={{ width: phoneEntered ? "50%" : otpEntered ? "100%" : "" }}
          className="progress"
        />
        <p className="progresscount">
          {phoneEntered
            ? "Almost there, Verify your phone with the OTP we sent you"
            : "Enter Your Phone Number"}
        </p>
      </div>

      <div className="form">
        {phoneEntered ? (
          <DigitsInput
            setDigitVals={setOtpVals}
            message="Verify your Phone with the OTP we sent you"
          />
        ) : (
          <PhoneInput setPhoneVal={setUserPhone} />
        )}

        <SubmitButton
          text={phoneEntered ? "Verify Phone Number" : "Save Phone Number"}
          icon={<Phone color={colors.textprimary} />}
          sxstyles={{ marginTop: "2rem" }}
          onclick={phoneEntered ? onVerifyPhone : onSubmitPhone}
        />
      </div>
    </section>
  );
}
