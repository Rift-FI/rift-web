import { JSX, useState, useEffect } from "react";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useBackButton } from "../hooks/backbutton";
import { useSnackbar } from "../hooks/snackbar";
import { signupUser, sendOtp } from "../utils/api/signup";
import { createAccount } from "../utils/api/wallet";
import { useSocket } from "../utils/SocketProvider";
import { PhoneInput } from "../components/security/PhoneInput";
import { DigitsInput } from "../components/security/DigitsInput";
import { Check, Rotate } from "../assets/icons";
import { Loading } from "../assets/animations";
import { colors } from "../constants";
import "../styles/pages/phoneauth.scss";

export default function PhoneAuth(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { initData } = useLaunchParams();
  const { socket } = useSocket();

  const tgUserId: string = `${String(initData?.user?.id as number)}`;
  const devicename = "Samsung-A15";

  const [devicetoken, setDeviceToken] = useState<string>("default-token");
  const [socketLoading, setSocketLoading] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [requestedOtp, setRequestedOtp] = useState<boolean>(false);
  const [otpVerified, setOtpVerified] = useState<boolean>(false);
  const [accountCreating, setAccountCreating] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(120);
  const [canResend, setCanResend] = useState<boolean>(false);

  const { mutate: mutateSendOtp, isPending: sendingOtp } = useMutation({
    mutationFn: () =>
      sendOtp(phoneNumber)
        .then((res) => {
          if (res?.status == 500) {
            showerrorsnack("Sorry, we couldn't send you the OTP");
          } else {
            showsuccesssnack("An OTP was sent to your phone");
            setRequestedOtp(true);
            setTimeRemaining(120);
            setCanResend(false);
          }
        })
        .catch(() => {
          showerrorsnack("Sorry, we couldn't send you the OTP");
        }),
  });

  const isLoading = socketLoading || sendingOtp || accountCreating;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")} : ${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const goBack = () => {
    navigate(-1);
  };

  const onSubmitPhoneAuth = async () => {
    setSocketLoading(true);

    try {
      if (!requestedOtp) {
        mutateSendOtp();
      } else {
        if (otpCode.length !== 4) {
          showerrorsnack("Please enter all 4 digits of the OTP");
          setSocketLoading(false);
          return;
        }

        try {
          const { status: signupstatus } = await signupUser(
            tgUserId,
            devicetoken,
            devicename,
            otpCode,
            phoneNumber
          );

          const { status: createaccstatus } = await createAccount(
            tgUserId,
            tgUserId,
            devicetoken,
            0,
            phoneNumber,
            otpCode
          );

          if (signupstatus == 200 && createaccstatus == 200) {
            localStorage.setItem("verifyphone", phoneNumber);
            showsuccesssnack("Your phone was verified successfully");
          } else {
            setOtpVerified(false);
            setAccountCreating(false);
            setRequestedOtp(false);
            setOtpCode("");
            showerrorsnack("Sorry, we couldn't verify your account");
          }
        } catch (error) {
          showerrorsnack("Sorry, we couldn't verify your account");
          console.error("Account creation process failed:", error);
          setOtpVerified(false);
          setAccountCreating(false);

          if (String(error).includes("verify")) {
            showerrorsnack("Invalid OTP, please try again.");
            setOtpCode("");
            setAccountCreating(false);
          } else {
            showerrorsnack("Sorry, an unexpected error occurred.");
          }
        }
      }
    } catch (err) {
      showerrorsnack("Sorry, an unexpected error occurred.");
    }

    setSocketLoading(false);
  };

  useEffect(() => {
    async function generateToken() {
      const token = await generatePersistentDeviceToken(tgUserId);
      setDeviceToken(token);
    }
    generateToken();
  }, [tgUserId]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (requestedOtp && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer as NodeJS.Timeout);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [requestedOtp, timeRemaining]);

  useEffect(() => {
    if (socket && requestedOtp && otpVerified) {
      const handleAccountCreationSuccess = (data: any) => {
        setSocketLoading(false);
        setAccountCreating(false);

        if (data?.user == tgUserId) {
          setTimeout(() => {
            goBack();
          }, 1500);
        } else {
          showerrorsnack("Something went wrong. Please try again.");
        }
      };

      const handleAccountCreationFailed = (error: any) => {
        console.error("Account creation failed:", error);
        setSocketLoading(false);
        setAccountCreating(false);
        setOtpVerified(false);
        showerrorsnack("We couldn't update your account, please try again");
      };

      socket.on("AccountCreationSuccess", handleAccountCreationSuccess);
      socket.on("AccountCreationFailed", handleAccountCreationFailed);

      return () => {
        socket.off("AccountCreationSuccess", handleAccountCreationSuccess);
        socket.off("AccountCreationFailed", handleAccountCreationFailed);
      };
    }
  }, [socket, requestedOtp, otpVerified]);

  useBackButton(goBack);

  return (
    <section id="phoneauth">
      <div className="auth-header">
        <p>
          {requestedOtp ? "Enter the OTP" : "Enter Your"}&nbsp;
          {requestedOtp ? "Sent to Your Phone" : "Phone Number"}
        </p>

        <span>
          {requestedOtp
            ? `We sent it to ${phoneNumber.substring(
                0,
                phoneNumber.length / 2
              )}***`
            : "We will send you an OTP to verify your phone number"}
        </span>
      </div>

      {requestedOtp ? (
        <div
          className="otp-input-container"
          onClick={() => {
            document.getElementById("hidden-otp-input")?.focus();
          }}
        >
          <p className="otp-input-subtitle">
            {otpVerified
              ? "Please wait..."
              : "Enter the 4-digit code sent to your phone"}
          </p>

          <DigitsInput setDigitVals={setOtpCode} />

          <div className="otp-timer">
            {canResend ? (
              <button
                className="resend"
                onClick={() => {
                  if (!sendingOtp && canResend) {
                    setOtpCode("");
                    mutateSendOtp();
                    showsuccesssnack("Sending new OTP code...");
                  }
                }}
                disabled={sendingOtp || !canResend}
              >
                Resend
                <Rotate
                  color={canResend ? colors.textprimary : colors.textsecondary}
                />
              </button>
            ) : (
              <span className="timer-value">
                Resend OTP in {formatTime(timeRemaining)}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="phone-input-container">
          <PhoneInput setPhoneVal={setPhoneNumber} />
        </div>
      )}

      <p className="note">
        Your phone number will be used to verify its you performing transactions
        on your wallet via OTPs
      </p>

      <div className="submit-ctr">
        <button
          className="submit-otp-phone"
          disabled={isLoading || sendingOtp}
          onClick={onSubmitPhoneAuth}
        >
          {isLoading || sendingOtp ? (
            <Loading />
          ) : (
            <>
              {requestedOtp ? "Verify Phone Number" : "Get OTP"}
              <Check color={colors.textprimary} />
            </>
          )}
        </button>
      </div>
    </section>
  );
}

const getPersistentDeviceInfo = async (): Promise<string> => {
  const deviceAttributes = [];

  deviceAttributes.push(navigator.hardwareConcurrency?.toString() || "");

  deviceAttributes.push(
    `${screen.width}x${screen.height}x${screen.colorDepth}`
  );

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");

    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");

      if (debugInfo) {
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        deviceAttributes.push(`${vendor}|${renderer}`);
      }
    }
  } catch (e) {
    console.log(e);
  }

  return deviceAttributes.filter(Boolean).join("|");
};

const generatePersistentDeviceToken = async (
  tgUserId: string
): Promise<string> => {
  const deviceInfo = await getPersistentDeviceInfo();

  const combinedString = `${tgUserId}-${deviceInfo}`;

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(combinedString)
  );

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const deviceToken = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return deviceToken;
};
