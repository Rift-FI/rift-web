import { JSX, useState, useEffect } from "react";
// import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { faCheckCircle, faPhone } from "@fortawesome/free-solid-svg-icons";
import { signupUser } from "../utils/api/signup";
import { createAccount } from "../utils/api/wallet";
import {
  signupQuvaultUser,
  signinQuvaultUser,
} from "../utils/api/quvault/auth";
import { useSocket } from "../utils/SocketProvider";
import { useSnackbar } from "../hooks/snackbar";
import { PhoneInput } from "../components/security/PhoneInput";
import { DigitsInput } from "../components/security/DigitsInput";
import { BottomButtonContainer } from "../components/Bottom";
import { SubmitButton } from "../components/global/Buttons";
import { FaIcon } from "../assets/faicon";
import { colors } from "../constants";
import "../styles/pages/phoneauth.scss";

export default function PhoneAuth(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();

  // const { initData } = useLaunchParams();
  const { socket } = useSocket();

  // const tgUserId: string = String(initData?.user?.id as number);
  const tgUserId = "7860394907";
  const devicetoken = "tqXsd4vr&8934UyOk";
  const devicename = "Samsung-A15";

  // create account socket events have completed authentication
  const [socketLoading, setSocketLoading] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [requestedOtp, setRequestedOtp] = useState<boolean>(false);

  const {
    mutate: mutatecreatewallet,
    isPending: creatingspherewallet,
    isSuccess: createwalletsuccess,
  } = useMutation({
    mutationFn: () => createAccount(tgUserId, tgUserId, devicetoken, 0),
  });
  const {
    mutate: mutateSignup,
    isPending: signupsphere,
    isSuccess: signupsuccess,
  } = useMutation({
    mutationFn: () =>
      signupUser(tgUserId, devicetoken, devicename, otpCode).then(() => {
        mutatecreatewallet();
      }),
  });

  // quvault (pst & launchpad)
  const {
    mutate: createquvaultaccount,
    isPending: signupquvault,
    isSuccess: createquvaultsuccess,
  } = useMutation({
    mutationFn: () =>
      signupQuvaultUser(tgUserId, `${tgUserId}@sphereid.com`, tgUserId).then(
        (res) => {
          if (res?.token) {
            localStorage.setItem("quvaulttoken", res?.token);
            mutateSignup();
          }
        }
      ),
  });
  const {
    mutate: quvaultlogin,
    isPending: loginginquvault,
    isSuccess: quvaultloginsuccess,
  } = useMutation({
    mutationFn: () =>
      signinQuvaultUser("7860394907@sphereid.com", "7860394907").then((res) => {
        if (res?.token) {
          localStorage.setItem("quvaulttoken", res?.token);
          mutateSignup();
        } else {
          createquvaultaccount();
        }
      }),
  });

  const onSubmitPhoneAuth = () => {
    if (requestedOtp) {
      if (otpCode.length < 4) {
        showerrorsnack("Please enter the full OTP Code");
      } else {
        quvaultlogin();
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

  useEffect(() => {
    if (
      signupsuccess &&
      createwalletsuccess &&
      (quvaultloginsuccess || createquvaultsuccess) &&
      socket
    ) {
      setSocketLoading(true);

      socket.on("AccountCreationSuccess", (data) => {
        localStorage.setItem("ethaddress", data?.address);
        localStorage.setItem("btcaddress", data?.btcAdress);
        localStorage.setItem("spheretoken", data?.accessToken);

        const retries = 8;

        if (data?.user == tgUserId) {
          socket.off("AccountCreationSuccess");
          socket.off("AccountCreationFailed");
          setSocketLoading(false);
          navigate("/app", { replace: true });
        } else {
          for (let i = 0; i < retries; i++) {
            mutateSignup();
          }
        }
      });

      socket.on("AccountCreationFailed", () => {
        setSocketLoading(false);
      });

      return () => {
        socket.off("AccountCreationSuccess");
        socket.off("AccountCreationFailed");
      };
    }
  }, [signupsuccess, createwalletsuccess]);

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
            backgroundColor:
              creatingspherewallet ||
              signupsphere ||
              signupquvault ||
              loginginquvault ||
              socketLoading
                ? colors.divider
                : colors.success,
          }}
          isLoading={
            creatingspherewallet ||
            signupsphere ||
            signupquvault ||
            loginginquvault ||
            socketLoading
          }
          isDisabled={
            creatingspherewallet ||
            signupsphere ||
            signupquvault ||
            loginginquvault ||
            socketLoading
          }
          onclick={onSubmitPhoneAuth}
        />
      </BottomButtonContainer>
    </section>
  );
}
