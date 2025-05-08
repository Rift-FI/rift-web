import { JSX, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { sendOtp, verifyOtp } from "../../utils/api/signup";
import { DigitsInput } from "../security/DigitsInput";
import { Check, PlusSolid } from "../../assets/icons";
import "../../styles/components/drawer/verifytx.scss";
import { colors } from "../../constants";

export const VerifyTransaction = (): JSX.Element => {
  const navigate = useNavigate();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  const [otpValue, setOTPValue] = useState<string>("");
  const [requestedOtp, setRequestedOtp] = useState<boolean>(false);

  const phoneNumber = localStorage.getItem("verifyphone") as string;

  const { mutate: mutateSendOtp, isPending: sendingOtp } = useMutation({
    mutationFn: () =>
      sendOtp(phoneNumber)
        .then(() => {
          showsuccesssnack("OTP Code sent successfully to your phone");
          setRequestedOtp(true);
        })
        .catch(() => {
          showerrorsnack("Failed to send OTP. Please try again.");
        }),
  });

  const { mutate: mutateVerifyOtp, isPending: verifyotppending } = useMutation({
    mutationFn: () =>
      verifyOtp(otpValue, phoneNumber)
        .then(() => {
          showsuccesssnack("OTP verified successfully");
          localStorage.setItem("txverified", "true");
          closeAppDrawer();
        })
        .catch(() => {
          showerrorsnack("Failed to verify, please try again");
          closeAppDrawer();
        }),
  });

  const onAddPhoneNumber = () => {
    navigate("/auth/phone");
    closeAppDrawer();
  };

  return (
    <div className="verifytransaction">
      <p className="verifymessage">
        Please request an OTP and verify to make sure its you performing this
        transaction
      </p>

      <DigitsInput
        setDigitVals={setOTPValue}
        message="Please enter the OTP you will receive"
      />

      <button
        className="submit-otp"
        onClick={() =>
          phoneNumber == null || typeof phoneNumber == undefined
            ? onAddPhoneNumber()
            : requestedOtp
            ? mutateVerifyOtp()
            : mutateSendOtp()
        }
        disabled={sendingOtp || verifyotppending}
      >
        {phoneNumber == null || typeof phoneNumber == undefined
          ? "Add Phone Number"
          : requestedOtp
          ? "Verify OTP"
          : "Request OTP"}
        {phoneNumber == null || typeof phoneNumber == undefined ? (
          <PlusSolid color={colors.textprimary} />
        ) : (
          <Check color={colors.textprimary} />
        )}
      </button>

      {(phoneNumber == null || typeof phoneNumber == undefined) && (
        <span className="submsg">
          Please add a Phone Number to your account to verify
        </span>
      )}
    </div>
  );
};
