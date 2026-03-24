import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import rift from "@/lib/rift";
import useUpdateUser from "@/hooks/data/use-update-user";
import ActionButton from "./action-button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface NotificationEmailSetupProps {
  isOpen: boolean;
  onComplete: () => void;
}

type Step = "email" | "otp" | "success";

export default function NotificationEmailSetup({ isOpen, onComplete }: NotificationEmailSetupProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const updateUserMutation = useUpdateUser();

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const autoSubmitTriggered = useRef(false);

  // Auto-submit when 4 characters are entered
  useEffect(() => {
    if (otp.length === 4 && !autoSubmitTriggered.current && !verifying) {
      autoSubmitTriggered.current = true;
      handleVerifyOTP();
    }
    if (otp.length < 4) {
      autoSubmitTriggered.current = false;
    }
  }, [otp]);

  const handleSendOTP = async () => {
    if (!isValidEmail) return;
    setSending(true);
    try {
      await rift.auth.sendOtp({ email });
      setStep("otp");
      toast.success("Verification code sent to " + email);
    } catch (err: any) {
      toast.error(err?.message || "Failed to send verification code");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 4) return;
    setVerifying(true);
    try {
      await rift.auth.verifyOtp({ code: otp, email });
      // OTP verified — save notification email to backend
      await updateUserMutation.mutateAsync({ notificationEmail: email });
      setStep("success");
      toast.success("Email verified successfully!");
      setTimeout(() => onComplete(), 1500);
    } catch (err: any) {
      toast.error(err?.message || "Invalid verification code");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setSending(true);
    try {
      await rift.auth.sendOtp({ email });
      toast.success("New code sent!");
    } catch {
      toast.error("Failed to resend code");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-app-background rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === "email" && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-accent-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-default">Add your email</h2>
                    <p className="text-xs text-text-subtle">Get notified about transactions</p>
                  </div>
                </div>

                <p className="text-sm text-text-subtle">
                  We'll send you updates about withdrawals, deposits, and payments. This is required to keep your account secure.
                </p>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && isValidEmail && handleSendOTP()}
                    placeholder="you@example.com"
                    className="w-full p-3 bg-surface-subtle border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-base"
                    autoFocus
                  />
                </div>

                <ActionButton
                  onClick={handleSendOTP}
                  disabled={!isValidEmail || sending}
                  className="w-full"
                >
                  {sending ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Sending code...</span>
                  ) : (
                    "Continue"
                  )}
                </ActionButton>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-accent-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-default">Check your email</h2>
                    <p className="text-xs text-text-subtle">{email}</p>
                  </div>
                </div>

                <p className="text-sm text-text-subtle">
                  Enter the 4-character code we sent to your email.
                </p>

                <div className="flex flex-row items-center justify-center w-full">
                  <InputOTP
                    value={otp}
                    onChange={setOtp}
                    maxLength={4}
                    inputMode="text"
                    autoFocus
                  >
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {verifying && (
                  <div className="flex items-center justify-center gap-2 text-sm text-text-subtle">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => { setStep("email"); setOtp(""); }}
                    className="text-sm text-text-subtle hover:text-text-default transition-colors"
                  >
                    Change email
                  </button>
                  <button
                    onClick={handleResendOTP}
                    disabled={sending}
                    className="text-sm text-accent-primary hover:underline disabled:opacity-50"
                  >
                    {sending ? "Sending..." : "Resend code"}
                  </button>
                </div>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-6 gap-3"
              >
                <CheckCircle2 className="w-12 h-12 text-green-500" />
                <h2 className="text-lg font-semibold text-text-default">Email verified!</h2>
                <p className="text-sm text-text-subtle text-center">
                  You'll receive transaction notifications at {email}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
