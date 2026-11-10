import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { useSearchParams, useNavigate } from "react-router";
import { FiUser, FiMail, FiSmartphone } from "react-icons/fi";
import { ChevronDown, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import ActionButton from "@/components/ui/action-button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useDisclosure } from "@/hooks/use-disclosure";
import { TokenValidating, TokenExpired, RecoverySuccess } from "../shared";
import {
  validateToken,
  recoverAccount,
  sendOtp,
} from "@/services/recovery-api";
import COUNTRY_PHONES from "@/lib/country-phones";

type Step = "validating" | "new-identifier" | "verify-otp" | "success" | "error";

export default function RecoverAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDesktop = useDesktopDetection();
  const token = searchParams.get("token");

  const [step, setStep] = useState<Step>("validating");
  const [errorMessage, setErrorMessage] = useState("");
  const [identifierType, setIdentifierType] = useState<"email" | "phone">("email");
  const [newIdentifier, setNewIdentifier] = useState("");
  const [countryCode, setCountryCode] = useState("+254");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const countryDrawer = useDisclosure();

  const countryDetails = useMemo(() => {
    const country = COUNTRY_PHONES.find((c) => c.code === countryCode);
    return country ?? COUNTRY_PHONES[0];
  }, [countryCode]);

  const filteredCountries = useMemo(() => {
    if (!phoneSearch || phoneSearch.trim() === "") return COUNTRY_PHONES;
    return COUNTRY_PHONES.filter(
      (c) =>
        c.countryname.toLowerCase().includes(phoneSearch.toLowerCase()) ||
        c.code.includes(phoneSearch)
    );
  }, [phoneSearch]);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setErrorMessage("No recovery token found.");
      setStep("error");
      return;
    }

    validateToken(token)
      .then((res) => {
        if (res.valid && res.type === "ACCOUNT_RECOVERY") {
          setStep("new-identifier");
        } else {
          setErrorMessage(res.message || "This link is no longer valid.");
          setStep("error");
        }
      })
      .catch((err) => {
        setErrorMessage(err.message || "This link has expired or is invalid.");
        setStep("error");
      });
  }, [token]);

  const getFullIdentifier = () => {
    if (identifierType === "email") return newIdentifier;
    let num = phoneNumber.startsWith("0")
      ? phoneNumber.trim().replace(/^0/, "")
      : phoneNumber.trim();
    return `${countryCode}${num}`;
  };

  const handleSendOtp = async () => {
    const identifier = getFullIdentifier();
    if (!identifier) return;

    setIsSendingOtp(true);
    try {
      await sendOtp(identifier, identifierType);
      toast.success(
        `Verification code sent to ${
          identifierType === "email" ? newIdentifier : `${countryCode}${phoneNumber}`
        }`
      );
      setStep("verify-otp");
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification code");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleRecover = async () => {
    if (!token || !otpCode) return;

    setIsSubmitting(true);
    try {
      await recoverAccount(token, getFullIdentifier(), identifierType, otpCode);
      setStep("success");
    } catch (err: any) {
      if (err.message?.includes("already associated")) {
        toast.error(
          `This ${identifierType} is already linked to another account`
        );
      } else {
        toast.error(err.message || "Recovery failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "validating") return <TokenValidating />;
  if (step === "error") return <TokenExpired message={errorMessage} />;
  if (step === "success") {
    return (
      <RecoverySuccess
        title="Account Recovered"
        description={`Your account has been updated. Sign in with your new ${identifierType}.`}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full h-screen flex flex-col bg-app-background"
    >
      <div
        className={`flex-1 flex flex-col items-center ${
          isDesktop ? "justify-center" : "justify-start pt-12"
        } px-6`}
      >
        <div className={`w-full ${isDesktop ? "max-w-md" : "max-w-sm"}`}>
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-accent-primary/10 rounded-full flex items-center justify-center">
              <FiUser className="w-7 h-7 text-accent-primary" />
            </div>
          </div>

          {step === "new-identifier" && (
            <>
              {/* Heading */}
              <div className="text-center mb-6">
                <h1
                  className={`${
                    isDesktop ? "text-2xl" : "text-xl"
                  } font-semibold text-text-default mb-2`}
                >
                  Recover Your Account
                </h1>
                <p className="text-sm text-text-subtle">
                  Enter your new {identifierType === "email" ? "email address" : "phone number"} to regain access
                </p>
              </div>

              {/* Type toggle */}
              <div className="flex rounded-2xl bg-surface-subtle p-1 mb-6">
                <button
                  onClick={() => setIdentifierType("email")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    identifierType === "email"
                      ? "bg-card text-accent-primary shadow-sm"
                      : "text-text-subtle"
                  }`}
                >
                  <FiMail className="w-4 h-4" />
                  Email
                </button>
                <button
                  onClick={() => setIdentifierType("phone")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    identifierType === "phone"
                      ? "bg-card text-accent-primary shadow-sm"
                      : "text-text-subtle"
                  }`}
                >
                  <FiSmartphone className="w-4 h-4" />
                  Phone
                </button>
              </div>

              {/* Input */}
              {identifierType === "email" ? (
                <div className="mb-6">
                  <label className="text-sm font-medium text-text-default mb-1.5 block">
                    New Email Address
                  </label>
                  <div className="flex items-center rounded-2xl px-4 py-3.5 bg-card border-2 border-hairline focus-within:border-accent-primary/40 transition-colors">
                    <FiMail className="w-4 h-4 text-text-subtle mr-3" />
                    <input
                      type="email"
                      inputMode="email"
                      value={newIdentifier}
                      onChange={(e) => setNewIdentifier(e.target.value)}
                      placeholder="your-email@example.com"
                      className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <label className="text-sm font-medium text-text-default mb-1.5 block">
                    New Phone Number
                  </label>
                  <div className="flex rounded-2xl border-2 border-hairline focus-within:border-accent-primary/40 transition-colors overflow-hidden bg-card">
                    <Drawer
                      open={countryDrawer.isOpen}
                      onClose={countryDrawer.onClose}
                      onOpenChange={(open) =>
                        open ? countryDrawer.onOpen() : countryDrawer.onClose()
                      }
                    >
                      <DrawerTrigger>
                        <div className="border-r border-hairline px-3 py-3.5 flex items-center gap-1 cursor-pointer hover:bg-surface-subtle transition-colors">
                          <span className="text-base">{countryDetails.flag}</span>
                          <span className="text-xs font-medium text-text-default">
                            {countryDetails.code}
                          </span>
                          <ChevronDown className="w-3 h-3 text-text-subtle" />
                        </div>
                      </DrawerTrigger>
                      <DrawerContent className="min-h-fit h-[60vh]">
                        <DrawerHeader className="hidden">
                          <DrawerTitle>Country Code</DrawerTitle>
                          <DrawerDescription>Select country code</DrawerDescription>
                        </DrawerHeader>

                        <div className="w-full flex items-center gap-2 px-3 py-3 bg-app-background border-b border-border">
                          <SearchIcon className="text-muted-foreground" size={18} />
                          <input
                            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
                            placeholder="Search..."
                            value={phoneSearch}
                            onChange={(e) => setPhoneSearch(e.target.value)}
                          />
                        </div>

                        <div className="w-full h-[50vh] p-4 pt-1 gap-3 overflow-scroll">
                          {filteredCountries.map((country, idx) => (
                            <div
                              key={country.code + idx}
                              onClick={() => {
                                setCountryCode(country.code);
                                countryDrawer.onClose();
                                setPhoneSearch("");
                              }}
                              className="w-full flex items-center justify-between py-3 cursor-pointer"
                            >
                              <p className="text-sm">{country.countryname}</p>
                              <div className="flex items-center gap-2">
                                <p>{country.flag}</p>
                                <p className="text-sm font-medium">{country.code}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </DrawerContent>
                    </Drawer>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Phone number"
                      className="flex-1 px-3 py-3.5 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              )}

              {/* Send OTP Button */}
              <ActionButton
                onClick={handleSendOtp}
                disabled={
                  isSendingOtp ||
                  (identifierType === "email"
                    ? !newIdentifier || !newIdentifier.includes("@")
                    : !phoneNumber || phoneNumber.length < 6)
                }
                loading={isSendingOtp}
                variant="secondary"
                className="w-full rounded-2xl"
              >
                Send Verification Code
              </ActionButton>

              <button
                onClick={() => navigate("/auth")}
                className="w-full text-center text-sm text-text-subtle mt-4 hover:text-accent-primary transition-colors"
              >
                Back to Sign In
              </button>
            </>
          )}

          {step === "verify-otp" && (
            <>
              {/* Heading */}
              <div className="text-center mb-6">
                <h1
                  className={`${
                    isDesktop ? "text-2xl" : "text-xl"
                  } font-semibold text-text-default mb-2`}
                >
                  Verify Your {identifierType === "email" ? "Email" : "Phone"}
                </h1>
                <p className="text-sm text-text-subtle">
                  Enter the code sent to{" "}
                  <span className="font-medium text-text-default">
                    {identifierType === "email"
                      ? newIdentifier
                      : `${countryCode}${phoneNumber}`}
                  </span>
                </p>
              </div>

              {/* OTP Input */}
              <div className="flex justify-center mb-6">
                <InputOTP
                  value={otpCode}
                  onChange={setOtpCode}
                  maxLength={identifierType === "phone" ? 6 : 4}
                  inputMode={identifierType === "email" ? "text" : "numeric"}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    {identifierType === "phone" && (
                      <>
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </>
                    )}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {/* Resend */}
              <button
                onClick={handleSendOtp}
                disabled={isSendingOtp}
                className="w-full text-center text-sm text-accent-primary mb-6 disabled:opacity-50"
              >
                {isSendingOtp ? "Sending..." : "Resend code"}
              </button>

              {/* Verify Button */}
              <ActionButton
                onClick={handleRecover}
                disabled={
                  isSubmitting ||
                  otpCode.length < (identifierType === "phone" ? 6 : 4)
                }
                loading={isSubmitting}
                variant="secondary"
                className="w-full rounded-2xl"
              >
                Verify & Recover Account
              </ActionButton>

              <button
                onClick={() => setStep("new-identifier")}
                className="w-full text-center text-sm text-text-subtle mt-4 hover:text-accent-primary transition-colors"
              >
                Go Back
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
