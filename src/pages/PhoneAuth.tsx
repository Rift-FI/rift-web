import { JSX, useState, useEffect } from "react";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { faCheckCircle, faPhone } from "@fortawesome/free-solid-svg-icons";
import { signupUser, sendOtp, verifyOtp } from "../utils/api/signup";
import { createAccount } from "../utils/api/wallet";
import {
  signupQuvaultUser,
  signinQuvaultUser,
} from "../utils/api/quvault/auth";
import { useSocket } from "../utils/SocketProvider";
import { useSnackbar } from "../hooks/snackbar";
import { PhoneInput } from "../components/security/PhoneInput";
import { BottomButtonContainer } from "../components/Bottom";
import { SubmitButton } from "../components/global/Buttons";
import { FaIcon } from "../assets/faicon";
import { colors } from "../constants";
import "../styles/pages/phoneauth.scss";

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

export default function PhoneAuth(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();

  const { initData } = useLaunchParams();
  const { socket } = useSocket();

  const tgUserId: string = `${String(initData?.user?.id as number)}`;

  const [devicetoken, setDeviceToken] = useState<string>("default-token");
  const devicename = "Samsung-A15";

  useEffect(() => {
    async function generateToken() {
      const token = await generatePersistentDeviceToken(tgUserId);
      setDeviceToken(token);
    }
    generateToken();
  }, [tgUserId]);

  // State management
  const [socketLoading, setSocketLoading] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [requestedOtp, setRequestedOtp] = useState<boolean>(false);
  const [otpVerified, setOtpVerified] = useState<boolean>(false);
  const [accountCreating, setAccountCreating] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(120); // 2 minutes
  const [canResend, setCanResend] = useState<boolean>(false);

  // Timer effect for OTP countdown
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

  // Format time remaining as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // We only need the send OTP mutation
  const { mutate: mutateSendOtp, isPending: sendingOtp } = useMutation({
    mutationFn: () =>
      sendOtp(phoneNumber).then((res) => {
        if (res?.status == 500) {
          showerrorsnack(
            "Failed to send OTP. Please check your phone number and try again."
          );
        } else {
          showsuccesssnack("OTP Code sent successfully to your phone");
          setRequestedOtp(true);
          setTimeRemaining(120);
          setCanResend(false);
          setRequestedOtp(true);
          localStorage.setItem("verifyphone", phoneNumber);
        }
      }),
  });

  // Combined loading state
  const isLoading = socketLoading || sendingOtp || accountCreating;

  // Verify button click handler
  const onSubmitPhoneAuth = async () => {
    setSocketLoading(true);

    try {
      if (!requestedOtp) {
        // First step: Request OTP
        mutateSendOtp();
      } else {
        // Second step: Verify OTP
        if (otpCode.length !== 4) {
          setOtpError(true);
          showerrorsnack("Please enter all 4 digits of the OTP");
          setSocketLoading(false);
          return;
        }

        try {
          // Verify OTP first
          await verifyOtp(otpCode, phoneNumber);
          setOtpVerified(true);
          showsuccesssnack(
            "Phone verification successful. Creating your account..."
          );
          setAccountCreating(true);

          // Try to sign in with QuVault first
          try {
            const quvaultSignInResult = await signinQuvaultUser(
              `${tgUserId}@sphereid.com`,
              tgUserId
            );

            if (quvaultSignInResult?.token) {
              console.log("QuVault login successful");
              localStorage.setItem("quvaulttoken", quvaultSignInResult.token);
              const referrer = localStorage.getItem("referrer");

              // Proceed with signup
              const { status } = await signupUser(
                tgUserId,
                devicetoken,
                devicename,
                otpCode,
                phoneNumber,
                referrer as string
              );

              if (status == 400) {
                setOtpVerified(false);
                setAccountCreating(false);
                setAccountCreating(true);
                showerrorsnack(
                  "We couldn't verify your account, please try again with the phone number you used initially"
                );
              }
            } else {
              // Create QuVault account if sign in fails
              console.log("QuVault login failed, creating new account");
              const quvaultSignUpResult = await signupQuvaultUser(
                tgUserId,
                `${tgUserId}@sphereid.com`,
                tgUserId
              );

              if (quvaultSignUpResult?.token) {
                localStorage.setItem("quvaulttoken", quvaultSignUpResult.token);

                const referrer = localStorage.getItem("referrer");
                const { status } = await signupUser(
                  tgUserId,
                  devicetoken,
                  devicename,
                  otpCode,
                  phoneNumber,
                  referrer as string
                );

                if (status == 400) {
                  setOtpVerified(false);
                  setAccountCreating(false);
                  setAccountCreating(true);
                  showerrorsnack(
                    "We couldn't verify your account, please try again with the phone number you used initially"
                  );
                }
              } else {
                throw new Error("Failed to create QuVault account");
              }
            }

            // Create account after successful signup
            const { status } = await createAccount(
              tgUserId,
              tgUserId,
              devicetoken,
              0,
              phoneNumber
            );
            if (status == 400) {
              setOtpVerified(false);
              setAccountCreating(false);
              setAccountCreating(true);
              showerrorsnack(
                "We couldn't verify your account, please try again with the phone number you used initially"
              );
            }

            // Socket listener will handle the completion and navigation
          } catch (error) {
            showerrorsnack(
              "We couldn't verify your account, please try again with the phone number you used initially"
            );
            console.error("Account creation process failed:", error);
            setOtpVerified(false);
            setAccountCreating(false);
            setAccountCreating(true);

            // Show appropriate error message
            if (String(error).includes("verify")) {
              showerrorsnack(
                "Invalid OTP. Please check the code and try again."
              );
              setAccountCreating(true);
              setOtpCode("");
              setAccountCreating(true);
            } else {
              showerrorsnack("Account creation failed. Please try again.");
            }
          }
        } catch (error) {
          console.error("OTP verification failed:", error);
          setOtpError(true);
          showerrorsnack("Failed to verify OTP");
        }
      }
    } catch (error) {
      console.error("Process failed:", error);
      showerrorsnack("An unexpected error occurred");
    }

    setSocketLoading(false);
  };

  // Set up socket listeners for account creation
  useEffect(() => {
    if (socket) {
      // Set up socket event listeners
      const handleAccountCreationSuccess = (data: any) => {
        // Store necessary data in localStorage
        if (data?.address) localStorage.setItem("ethaddress", data.address);
        if (data?.btcAdress) localStorage.setItem("btcaddress", data.btcAdress);
        if (data?.accessToken)
          localStorage.setItem("spheretoken", data.accessToken);
        localStorage.setItem("firsttimeuse", "false");

        console.log("Account creation success:", data);
        setSocketLoading(false);
        setAccountCreating(false);

        if (data?.user == tgUserId) {
          showsuccesssnack("Your wallet is ready! Redirecting to app...");
          localStorage.removeItem("referrer");

          // Small delay to show the success message
          setTimeout(() => {
            navigate("/app", { replace: true });
          }, 1500);
        } else {
          // If the user ID doesn't match, something went wrong
          console.error("User ID mismatch in account creation");
          showerrorsnack("Something went wrong. Please try again.");
        }
      };

      const handleAccountCreationFailed = (error: any) => {
        console.error("Account creation failed:", error);
        setSocketLoading(false);
        setAccountCreating(false);
        setOtpVerified(false);
        showerrorsnack(
          typeof error === "string"
            ? error
            : "Failed to create your account. Please try again."
        );
      };

      // Register listeners
      socket.on("AccountCreationSuccess", handleAccountCreationSuccess);
      socket.on("AccountCreationFailed", handleAccountCreationFailed);

      // Cleanup function
      return () => {
        socket.off("AccountCreationSuccess", handleAccountCreationSuccess);
        socket.off("AccountCreationFailed", handleAccountCreationFailed);
      };
    }
  }, [socket, tgUserId, navigate, showsuccesssnack, showerrorsnack]);

  return (
    <section id="phoneauth">
      <div className="auth-header">
        <h1>
          {requestedOtp ? "Enter the OTP" : "Enter Your"}
          <br /> {requestedOtp ? "Sent to Your Phone" : "Phone Number"}
        </h1>
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
          <h3 className="otp-input-title">
            {otpVerified ? "Creating Your Account" : "Verification Code"}
          </h3>
          <p className="otp-input-subtitle">
            {otpVerified
              ? "Please wait while we set up your wallet..."
              : "Enter the 4-digit code sent to your phone"}
          </p>

          {!otpVerified ? (
            <>
              <div className="otp-input-grid">
                {[0, 1, 2, 3].map((_, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={otpCode[index] || ""}
                    className={`digit-box ${otpCode[index] ? "filled" : ""} ${
                      otpError ? "error" : ""
                    }`}
                    readOnly
                    onClick={(e) => {
                      // Stop propagation to prevent double focus events
                      e.stopPropagation();
                      document.getElementById("hidden-otp-input")?.focus();
                    }}
                  />
                ))}
              </div>

              {/* Hidden input for actual input handling */}
              <input
                id="hidden-otp-input"
                type="tel"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={4}
                placeholder=""
                value={otpCode}
                onChange={(e) => {
                  // Only allow digits
                  const digitOnly = e.target.value.replace(/\D/g, "");
                  setOtpCode(digitOnly);
                  if (otpError) setOtpError(false);
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  opacity: 0,
                  zIndex: -1,
                  height: "1px",
                  width: "1px",
                }}
                autoFocus
              />

              <div className="otp-timers">
                Time remaining:{" "}
                <span className="timer-value">{formatTime(timeRemaining)}</span>
                <button
                  className="resend-button"
                  onClick={() => {
                    if (!sendingOtp && canResend) {
                      setOtpCode("");
                      mutateSendOtp();
                      showsuccesssnack("Sending new OTP code...");
                    }
                  }}
                  disabled={sendingOtp || !canResend}
                >
                  {sendingOtp ? "Sending..." : "Resend OTP"}
                </button>
              </div>

              {otpError && (
                <p className="error-message">
                  Invalid verification code. Please try again.
                </p>
              )}
            </>
          ) : (
            <div className="account-creation-progress">
              <div className="progress-spinner"></div>
              <p className="progress-status">
                {accountCreating ? "Setting up your wallet..." : "Verifying..."}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="phone-input-container">
          <PhoneInput setPhoneVal={setPhoneNumber} />
        </div>
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
              color={colors.primary}
            />
          }
          sxstyles={{
            gap: "0.5rem",
            padding: "0.75rem 1.5rem",
            borderRadius: "1.5rem",
            fontSize: "1rem",
            fontWeight: "500",
          }}
          isLoading={isLoading}
          isDisabled={isLoading}
          onclick={onSubmitPhoneAuth}
        />
      </BottomButtonContainer>
    </section>
  );
}
