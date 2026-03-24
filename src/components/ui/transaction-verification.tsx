import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ShieldCheck } from "lucide-react";
import { FiX } from "react-icons/fi";
import { toast } from "sonner";
import rift from "@/lib/rift";
import useUser from "@/hooks/data/use-user";
import ActionButton from "./action-button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type AuthMethod = "otp" | "password";

interface TransactionVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (verification: { otpCode?: string; password?: string }) => void;
  title?: string;
}

export default function TransactionVerification({
  isOpen,
  onClose,
  onVerified,
  title = "Verify Transaction",
}: TransactionVerificationProps) {
  const { data: user } = useUser();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const autoSubmitTriggered = useRef(false);

  const authMethod: AuthMethod = user?.externalId ? "password" : "otp";

  // OTP goes to the signup method: email if email user, phone if phone user
  const otpTarget = user?.email || user?.phoneNumber;
  const isEmailOtp = !!user?.email;

  // Send OTP when modal opens (for OTP users)
  useEffect(() => {
    if (isOpen && authMethod === "otp" && !otpSent) {
      sendOtp();
    }
    if (!isOpen) {
      setCode("");
      setPassword("");
      setOtpSent(false);
      autoSubmitTriggered.current = false;
    }
  }, [isOpen]);

  // Auto-submit OTP when 4 characters entered
  useEffect(() => {
    if (authMethod === "otp" && code.length === 4 && !autoSubmitTriggered.current) {
      autoSubmitTriggered.current = true;
      onVerified({ otpCode: code.trim() });
    }
    if (code.length < 4) {
      autoSubmitTriggered.current = false;
    }
  }, [code]);

  const sendOtp = async () => {
    if (!otpTarget) {
      toast.error("No email or phone on file. Please set a notification email first.");
      return;
    }
    setSending(true);
    try {
      if (isEmailOtp) {
        await rift.auth.sendOtp({ email: otpTarget });
      } else {
        await rift.auth.sendOtp({ phone: otpTarget });
      }
      setOtpSent(true);
      toast.success(`Code sent to ${maskTarget(otpTarget)}`);
    } catch {
      toast.error("Failed to send verification code");
    } finally {
      setSending(false);
    }
  };

  const handleConfirm = () => {
    if (authMethod === "password") {
      if (!password.trim()) return;
      onVerified({ password: password.trim() });
    } else {
      if (code.length < 4) return;
      onVerified({ otpCode: code.trim() });
    }
  };

  const isValid = authMethod === "password" ? password.trim().length >= 4 : code.length >= 4;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-app-background rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-primary/10 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-accent-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-default">{title}</h2>
                <p className="text-xs text-text-subtle">
                  {authMethod === "password"
                    ? "Enter your password to confirm"
                    : `Code sent to ${maskTarget(otpTarget || "")}`}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-surface-subtle rounded-full transition-colors">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Input */}
          {authMethod === "password" ? (
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && isValid && handleConfirm()}
                placeholder="Enter your password"
                className="w-full p-3 bg-surface-subtle border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-base"
                autoFocus
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1.5">Verification code</label>
              <div className="flex flex-row items-center justify-center w-full">
                <InputOTP
                  value={code}
                  onChange={setCode}
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
              <div className="flex justify-end mt-1.5">
                <button
                  onClick={sendOtp}
                  disabled={sending}
                  className="text-sm text-accent-primary hover:underline disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Resend code"}
                </button>
              </div>
            </div>
          )}

          {/* Confirm */}
          <ActionButton
            onClick={handleConfirm}
            disabled={!isValid}
            className="w-full"
          >
            Confirm
          </ActionButton>
        </div>
      </motion.div>
    </div>
  );
}

function maskTarget(target: string): string {
  if (!target) return "";
  if (target.includes("@")) {
    const [local, domain] = target.split("@");
    return `${local[0]}${"*".repeat(Math.max(local.length - 2, 1))}${local[local.length - 1]}@${domain}`;
  }
  // Phone
  return target.slice(0, 4) + "****" + target.slice(-2);
}
