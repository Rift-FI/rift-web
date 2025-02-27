import { JSX, useState } from "react";
import { useNavigate } from "react-router";
import { TextField } from "@mui/material";
import { useBackButton } from "../../hooks/backbutton";
import { useSnackbar } from "../../hooks/snackbar";
import { DigitsInput } from "../../components/security/DigitsInput";
import { colors } from "../../constants";
import { Email } from "../../assets/icons/security";
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
          <TextField
            value={userEmail}
            onChange={(ev) => setUserEmail(ev.target.value)}
            label="Email Address"
            placeholder="your-email@domain.com"
            fullWidth
            variant="outlined"
            type="email"
            autoComplete="off"
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
        )}

        <button
          className="submitemail"
          onClick={emailEntered ? onSubmitOtp : onSubmitEmailAddr}
        >
          {emailEntered ? "Verify Email Address" : "Save Email"}
          <Email color={colors.textprimary} />
        </button>
      </div>
    </section>
  );
}
