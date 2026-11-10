import { motion } from "motion/react";
import { FiShield, FiMail, FiSmartphone, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import { useNavigate } from "react-router";
import ActionButton from "@/components/ui/action-button";
import RiftLoader from "@/components/ui/rift-loader";
import useDesktopDetection from "@/hooks/use-desktop-detection";

export function TokenValidating() {
  const isDesktop = useDesktopDetection();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-screen flex flex-col items-center justify-center bg-app-background"
    >
      <div className={`flex flex-col items-center ${isDesktop ? "gap-4" : "gap-3"}`}>
        <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center">
          <FiShield className="w-8 h-8 text-accent-primary" />
        </div>
        <RiftLoader size="md" />
        <p className="text-sm text-text-subtle">Validating your link...</p>
      </div>
    </motion.div>
  );
}

export function TokenExpired({ message }: { message?: string }) {
  const navigate = useNavigate();
  const isDesktop = useDesktopDetection();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full h-screen flex flex-col items-center justify-center bg-app-background px-6"
    >
      <div className={`flex flex-col items-center text-center ${isDesktop ? "max-w-md" : "max-w-sm"}`}>
        <div className="w-16 h-16 bg-tint-danger rounded-full flex items-center justify-center mb-4">
          <FiAlertTriangle className="w-8 h-8 text-danger" />
        </div>
        <h2 className={`${isDesktop ? "text-2xl" : "text-xl"} font-semibold text-text-default mb-2`}>
          Link Expired
        </h2>
        <p className="text-sm text-text-subtle mb-8">
          {message || "This recovery link has expired or is no longer valid. Please request a new one."}
        </p>
        <ActionButton
          onClick={() => navigate("/auth")}
          variant="secondary"
          className="w-full max-w-xs rounded-2xl"
        >
          Back to Sign In
        </ActionButton>
      </div>
    </motion.div>
  );
}

interface LinkSentProps {
  method: "emailRecovery" | "phoneRecovery";
  maskedTarget: string;
  onBackToLogin: () => void;
}

export function LinkSentConfirmation({ method, maskedTarget, onBackToLogin }: LinkSentProps) {
  const isDesktop = useDesktopDetection();
  const isEmail = method === "emailRecovery";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center text-center ${isDesktop ? "py-12" : "py-8"} px-4`}
    >
      <div className="w-16 h-16 bg-tint-success rounded-full flex items-center justify-center mb-4">
        {isEmail ? (
          <FiMail className="w-8 h-8 text-success" />
        ) : (
          <FiSmartphone className="w-8 h-8 text-success" />
        )}
      </div>
      <h2 className={`${isDesktop ? "text-2xl" : "text-xl"} font-semibold text-text-default mb-2`}>
        Check your {isEmail ? "email" : "phone"}
      </h2>
      <p className="text-sm text-text-subtle mb-2 max-w-xs">
        We sent a recovery link to
      </p>
      <p className="text-sm font-medium text-text-default mb-6">
        {maskedTarget}
      </p>
      <p className="text-xs text-text-subtle mb-8 max-w-xs">
        Click the link in the {isEmail ? "email" : "message"} to continue. The link expires in 15 minutes.
      </p>
      <ActionButton
        onClick={onBackToLogin}
        variant="ghost"
        className="w-full max-w-xs rounded-2xl border border-hairline"
      >
        Back to Sign In
      </ActionButton>
    </motion.div>
  );
}

export function RecoverySuccess({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const navigate = useNavigate();
  const isDesktop = useDesktopDetection();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full h-screen flex flex-col items-center justify-center bg-app-background px-6"
    >
      <div className={`flex flex-col items-center text-center ${isDesktop ? "max-w-md" : "max-w-sm"}`}>
        <div className="w-16 h-16 bg-tint-success rounded-full flex items-center justify-center mb-4">
          <FiCheckCircle className="w-8 h-8 text-success" />
        </div>
        <h2 className={`${isDesktop ? "text-2xl" : "text-xl"} font-semibold text-text-default mb-2`}>
          {title}
        </h2>
        <p className="text-sm text-text-subtle mb-8">{description}</p>
        <ActionButton
          onClick={() => navigate("/auth")}
          variant="secondary"
          className="w-full max-w-xs rounded-2xl"
        >
          Sign In
        </ActionButton>
      </div>
    </motion.div>
  );
}
