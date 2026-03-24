import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  IoWalletOutline,
  IoNotificationsOutline,
  IoChevronForward,
  IoLogOutOutline,
  IoCheckmarkCircle,
  IoWarning,
  IoPlayCircleOutline,
  IoRefreshOutline,
  IoShareSocialOutline,
  IoCopyOutline,
  IoLogoWhatsapp,
} from "react-icons/io5";
import { FaTelegram } from "react-icons/fa";
import { HiMiniUser } from "react-icons/hi2";
import { MdAlternateEmail } from "react-icons/md";
import { HiPhone } from "react-icons/hi";
import { Pencil, Check, X, Gift, Shield } from "lucide-react";
import { usePlatformDetection } from "@/utils/platform";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import useUser from "@/hooks/data/use-user";
import useKYCStatus from "@/hooks/data/use-kyc-status";
import useUpdateUser from "@/hooks/data/use-update-user";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ActionButton from "@/components/ui/action-button";
import PaymentAccountSetup from "@/components/ui/payment-account-setup";
import { NotificationSettings } from "@/components/notifications";
import { useDisclosure } from "@/hooks/use-disclosure";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import useWalletRecovery from "@/hooks/wallet/use-wallet-recovery";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { formatNumberWithCommas } from "@/lib/utils";
import { getReferralLink } from "@/utils/referral";
import { useOnboardingDemo } from "@/contexts/OnboardingDemoContext";
import { forceClearCacheAndRefresh, APP_VERSION } from "@/utils/auto-update";
import posthog from "posthog-js";
import useAnalytics from "@/hooks/use-analytics";
import useCountryDetection, { SupportedCurrency } from "@/hooks/data/use-country-detection";
import { SUPPORTED_CURRENCIES } from "@/components/ui/currency-selector";
import useDesktopDetection from "@/hooks/use-desktop-detection";
import DesktopPageLayout from "@/components/layouts/desktop-page-layout";

// Supported currencies for mobile money withdrawals
const WITHDRAWAL_SUPPORTED_CURRENCIES: SupportedCurrency[] = ["KES", "NGN", "UGX", "TZS", "CDF", "MWK", "BRL"];

export default function Profile() {
  const navigate = useNavigate();
  const { logEvent } = useAnalytics();
  const { onOpen, onClose, isOpen } = useDisclosure();
  const [showPaymentSetup, setShowPaymentSetup] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] =
    useState(false);
  const [showReferralDrawer, setShowReferralDrawer] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);

  const { isTelegram, telegramUser } = usePlatformDetection();
  const { userQuery, signInMutation } = useWalletAuth();
  const { data: user, isLoading: userLoading } = useUser();
  const referralCode = user?.referralCode || "";
  const updateUserMutation = useUpdateUser();
  const {
    isKYCVerified,
    isUnderReview,
    isLoading: kycLoading,
  } = useKYCStatus();

  const hasPassword = !!userQuery?.data?.externalId;
  const userIdentifier = userQuery?.data?.phoneNumber || userQuery?.data?.email;
  const userIdentifierType: "phone" | "email" | undefined = userQuery?.data?.phoneNumber
    ? "phone"
    : userQuery?.data?.email
    ? "email"
    : undefined;

  const {
    recoveryMethodsQuery,
    recoveryOptionsByIdentifierQuery,
    removeRecoveryMethodMutation,
    sendOtpMutation,
    myRecoveryMethodsQuery,
  } = useWalletRecovery({
    externalId: userQuery?.data?.externalId,
    identifier: !hasPassword ? userIdentifier : undefined,
    identifierType: !hasPassword ? userIdentifierType : undefined,
  });

  useEffect(() => {
    logEvent("PAGE_VISIT_PROFILE");
  }, []);

  // Compute connected recovery methods (works for both user types)
  const recoveryEmail = hasPassword
    ? recoveryMethodsQuery.data?.recoveryOptions?.email
    : recoveryOptionsByIdentifierQuery.data?.recoveryOptions?.email;
  const recoveryPhone = hasPassword
    ? recoveryMethodsQuery.data?.recoveryOptions?.phone
    : recoveryOptionsByIdentifierQuery.data?.recoveryOptions?.phone;

  // Detect country and get selected currency
  const { data: countryInfo } = useCountryDetection();
  
  // Get current selected currency (from localStorage or detected country)
  const getCurrentCurrency = (): SupportedCurrency => {
    const stored = localStorage.getItem("selected_currency");
    if (stored && (stored as SupportedCurrency)) {
      return stored as SupportedCurrency;
    }
    return countryInfo?.currency || "USD";
  };

  const currentCurrency = getCurrentCurrency();
  const isWithdrawalSupported = WITHDRAWAL_SUPPORTED_CURRENCIES.includes(currentCurrency);

  // Onboarding demo
  const { startDemo } = useOnboardingDemo();
  
  // Desktop detection
  const isDesktop = useDesktopDetection();

  // Initialize display name from user data (handle both camelCase and snake_case)
  const userDisplayName = user?.displayName || user?.display_name;
  if (userDisplayName && !displayName) {
    setDisplayName(userDisplayName);
  }

  const referralLink = getReferralLink(referralCode);

  const handleCopyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      logEvent("REFERRAL_LINK_COPIED", {
        referral_code: referralCode,
      });
      toast.success("Referral link copied!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleShareWhatsApp = () => {
    logEvent("REFERRAL_LINK_SHARED", {
      referral_code: referralCode,
      share_method: "whatsapp",
    });
    const text = encodeURIComponent(
      `Join me on Rift - your global USD account for payments, transfers & wealth building!\n\n${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleShareTelegram = () => {
    logEvent("REFERRAL_LINK_SHARED", {
      referral_code: referralCode,
      share_method: "telegram",
    });
    const text = encodeURIComponent(
      `Join me on Rift - your global USD account for payments, transfers & wealth building!`
    );
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(
        referralLink
      )}&text=${text}`,
      "_blank"
    );
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Rift",
          text: "Join me on Rift - your global USD account for payments, transfers & wealth building!",
          url: referralLink,
        });
        logEvent("REFERRAL_LINK_SHARED", {
          referral_code: referralCode,
          share_method: "native",
        });
      } catch (error) {
        // User cancelled or error
        if ((error as Error).name !== "AbortError") {
          handleCopyReferralLink();
        }
      }
    } else {
      handleCopyReferralLink();
    }
  };

  const handleUpdatePaymentAccount = async (paymentAccount: string) => {
    try {
      await updateUserMutation.mutateAsync({ paymentAccount });
      toast.success("Withdrawal account updated successfully!");
    } catch (error) {
      
      toast.error("Failed to update withdrawal account");
    }
  };

  const handleUpdateDisplayName = async () => {
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }

    try {
      await updateUserMutation.mutateAsync({ displayName: displayName.trim() });
      setIsEditingName(false);
      toast.success("Display name updated successfully!");
    } catch (error) {
      
      toast.error("Failed to update display name");
    }
  };

  const onLogOut = () => {
    logEvent("SIGN_OUT", { reason: "manual_logout" });
    posthog.reset();
    localStorage.clear();
    navigate("/auth");
  };

  const onAddRecovery = () => {
    onOpen();
  };

  const onRecover = (method: "phone" | "email") => {
    onClose();
    navigate(`/app/profile/recovery/${method}`);
  };

  // --- Remove recovery verification flow ---
  const [removeMethod, setRemoveMethod] = useState<"emailRecovery" | "phoneRecovery" | null>(null);
  const [removeOtpStep, setRemoveOtpStep] = useState(false);
  const [removeOtpCode, setRemoveOtpCode] = useState("");
  const [removePassword, setRemovePassword] = useState("");
  const [isSendingRemoveOtp, setIsSendingRemoveOtp] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const onRemoveRecovery = (method: "emailRecovery" | "phoneRecovery") => {
    // Can't remove the last method
    if (method === "emailRecovery" && !recoveryPhone) {
      toast.error("Cannot remove your only recovery method");
      return;
    }
    if (method === "phoneRecovery" && !recoveryEmail) {
      toast.error("Cannot remove your only recovery method");
      return;
    }

    setRemoveMethod(method);
    setRemoveOtpCode("");
    setRemovePassword("");
    setRemoveOtpStep(false);

    if (!hasPassword && userIdentifier) {
      // Non-password users: send OTP immediately
      setIsSendingRemoveOtp(true);
      sendOtpMutation
        .mutateAsync({
          identifier: userIdentifier,
          type: userIdentifierType!,
        })
        .then(() => {
          setRemoveOtpStep(true);
          toast.success(
            `Verification code sent to your ${userIdentifierType === "phone" ? "phone" : "email"}`
          );
        })
        .catch((err: any) => {
          toast.error(err.message || "Failed to send verification code");
          setRemoveMethod(null);
        })
        .finally(() => setIsSendingRemoveOtp(false));
    }
  };

  const handleConfirmRemove = async () => {
    if (!removeMethod) return;

    const identifierFields =
      userIdentifierType === "phone"
        ? { phoneNumber: userIdentifier }
        : { email: userIdentifier };

    setIsRemoving(true);
    try {
      if (hasPassword) {
        // Verify password first
        await signInMutation.mutateAsync({
          externalId: userQuery?.data?.externalId,
          password: removePassword,
        });

        await removeRecoveryMethodMutation.mutateAsync({
          externalId: userQuery?.data?.externalId,
          method: removeMethod,
          password: removePassword,
        });
      } else {
        // Non-password users: send OTP code + identifier
        await removeRecoveryMethodMutation.mutateAsync({
          method: removeMethod,
          otpCode: removeOtpCode,
          ...identifierFields,
        });
      }

      toast.success("Recovery method removed");
      setRemoveMethod(null);
      recoveryMethodsQuery.refetch();
      recoveryOptionsByIdentifierQuery.refetch();
      myRecoveryMethodsQuery.refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove recovery method");
    } finally {
      setIsRemoving(false);
    }
  };

  const closeRemoveDrawer = () => {
    setRemoveMethod(null);
    setRemoveOtpStep(false);
    setRemoveOtpCode("");
    setRemovePassword("");
  };

  const content = (
    <>
      {/* Profile Header - Fixed at top */}
      <motion.div
        initial={{ x: -4, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={`flex-shrink-0 z-20 border-b ${
          isDesktop
            ? "bg-white border-gray-200 px-8 py-8"
            : "bg-app-background border-surface-subtle"
        }`}
      >
        <div
          className={`${
            isDesktop ? "max-w-4xl mx-auto" : "px-4"
          } ${isDesktop ? "pt-0 pb-6" : "pt-6 pb-4"}`}
        >
          <div className="flex items-center gap-4">
            {isTelegram ? (
              <Avatar className="w-14 h-14 min-w-14 min-h-14 border-2 border-accent-primary/20">
                <AvatarImage
                  className="rounded-full"
                  src={telegramUser?.photoUrl}
                  alt={telegramUser?.username}
                />
                <AvatarFallback className="bg-accent-primary/10 text-accent-primary text-lg">
                  {telegramUser?.username?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-14 h-14 min-w-14 min-h-14 rounded-full bg-accent-primary/10 border-2 border-accent-primary/20 flex items-center justify-center flex-shrink-0">
                <HiMiniUser className="text-2xl text-accent-primary" />
              </div>
            )}

            {/* Editable Display Name */}
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="flex-1 min-w-0 bg-surface-subtle text-text-default text-base font-semibold placeholder:text-text-subtle outline-none px-3 py-1.5 rounded-2xl border border-surface"
                    autoFocus
                  />
                  <button
                    onClick={handleUpdateDisplayName}
                    disabled={updateUserMutation.isPending}
                    className="p-2 bg-accent-primary text-white rounded-2xl hover:bg-accent-secondary transition-colors flex-shrink-0"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false);
                      setDisplayName(userDisplayName || "");
                    }}
                    className="p-2 bg-surface-subtle rounded-2xl hover:bg-surface transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-text-subtle" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                >
                  <span className="text-lg font-semibold text-text-default">
                    {userDisplayName || "Set your name"}
                  </span>
                  <Pencil className="w-3.5 h-3.5 text-text-subtle" />
                </button>
              )}
              <p className="text-xs text-text-subtle mt-0.5">Profile Settings</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scrollable Content */}
      <div
        className={`flex-1 overflow-y-auto overflow-x-hidden overscroll-contain space-y-6 ${
          isDesktop
            ? "px-8 py-8 max-w-4xl mx-auto bg-gray-50"
            : "px-4 py-4 pb-24 space-y-4"
        }`}
      >
        {/* Settings Sections */}
        <div
          className={`rounded-2xl overflow-hidden ${
            isDesktop
              ? "bg-white border border-gray-200 shadow-sm"
              : "bg-surface-alt"
          }`}
        >
          <p
            className={`px-4 pt-4 pb-2 text-xs font-medium uppercase tracking-wide ${
              isDesktop ? "text-gray-500" : "text-text-subtle"
            }`}
          >
            Account
          </p>

          {/* Withdrawal Account */}
          <button
            onClick={() => setShowPaymentSetup(true)}
            className="w-full px-4 py-3.5 flex items-center justify-between transition-colors hover:bg-surface-subtle/50 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-blue-500/10">
                <IoWalletOutline className="text-blue-500 text-lg" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-text-default">
                  Withdrawal Account
                </p>
                <p className="text-xs text-text-subtle">
                  {(() => {
                    const paymentAccount =
                      user?.paymentAccount || user?.payment_account;
                    if (paymentAccount) {
                      try {
                        const account = JSON.parse(paymentAccount);
                        return `${account.institution} • ${account.accountIdentifier}`;
                      } catch {
                        return "Configured";
                      }
                    }
                    return "Not configured";
                  })()}
                </p>
              </div>
            </div>
            <IoChevronForward className="text-text-subtle" />
          </button>

          {/* Push Notifications */}
          <button
            onClick={() => setShowNotificationSettings(true)}
            className={`w-full px-4 py-3.5 flex items-center justify-between transition-colors ${
              isDesktop
                ? "hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                : "hover:bg-surface-subtle/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <IoNotificationsOutline className="text-purple-500 text-lg" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-text-default">
                  Push Notifications
                </p>
                <p className="text-xs text-text-subtle">Manage alerts</p>
              </div>
            </div>
            <IoChevronForward className="text-text-subtle" />
          </button>

          {/* Invite Friends */}
          <button
            onClick={() => setShowReferralDrawer(true)}
            className={`w-full px-4 py-3.5 flex items-center justify-between transition-colors ${
              isDesktop
                ? "hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                : "hover:bg-surface-subtle/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent-primary/10 flex items-center justify-center">
                <Gift className="text-accent-primary w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-text-default">
                  Invite Friends
                </p>
                <p className="text-xs text-text-subtle">
                  Share your referral link
                </p>
              </div>
            </div>
            <IoChevronForward className="text-text-subtle" />
          </button>

          {/* Replay Demo */}
          <button
            onClick={startDemo}
            className={`w-full px-4 py-3.5 flex items-center justify-between transition-colors ${
              isDesktop
                ? "hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                : "hover:bg-surface-subtle/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center">
                <IoPlayCircleOutline className="text-teal-500 text-lg" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-text-default">
                  App Tutorial
                </p>
                <p className="text-xs text-text-subtle">
                  Replay the welcome demo
                </p>
              </div>
            </div>
            <IoChevronForward className="text-text-subtle" />
          </button>

          {/* Account Recovery */}
          <button
            onClick={onAddRecovery}
            className={`w-full px-4 py-3.5 flex items-center justify-between transition-colors ${
              isDesktop
                ? "hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                : "hover:bg-surface-subtle/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Shield className="text-orange-500 w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-text-default">
                  Account Recovery
                </p>
                <p className="text-xs text-text-subtle">
                  {recoveryEmail || recoveryPhone
                    ? "Recovery method configured"
                    : "Set up a backup contact"}
                </p>
              </div>
            </div>
            <IoChevronForward className="text-text-subtle" />
          </button>
        </div>

        {/* Compliance Section */}
        <div
          className={`rounded-2xl overflow-hidden ${
            isDesktop
              ? "bg-white border border-gray-200 shadow-sm"
              : "bg-surface-alt"
          }`}
        >
          <p
            className={`px-4 pt-4 pb-2 text-xs font-medium uppercase tracking-wide ${
              isDesktop ? "text-gray-500" : "text-text-subtle"
            }`}
          >
            Compliance
          </p>

          <button
            onClick={() => !isKYCVerified && !isUnderReview && navigate("/kyc")}
            disabled={isKYCVerified || isUnderReview}
            className={`w-full px-4 py-3.5 flex items-center justify-between transition-colors ${
              isKYCVerified || isUnderReview
                ? "cursor-default"
                : "hover:bg-surface-subtle/50 cursor-pointer"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isKYCVerified
                    ? "bg-green-500/10"
                    : isUnderReview
                    ? "bg-blue-500/10"
                    : "bg-amber-500/10"
                }`}
              >
                {kycLoading ? (
                  <div className="w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                ) : isKYCVerified ? (
                  <IoCheckmarkCircle className="text-green-500 text-lg" />
                ) : isUnderReview ? (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <IoWarning className="text-amber-500 text-lg" />
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-text-default">
                  Identity Verification
                </p>
                <p
                  className={`text-xs ${
                    isKYCVerified
                      ? "text-green-600 dark:text-green-400"
                      : isUnderReview
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {kycLoading
                    ? "Checking..."
                    : isKYCVerified
                    ? "Verified ✓"
                    : isUnderReview
                    ? "Under Review - Check back shortly"
                    : "Not verified - Tap to verify"}
                </p>
              </div>
            </div>
            {!isKYCVerified && !isUnderReview && !kycLoading && (
              <IoChevronForward className="text-text-subtle" />
            )}
          </button>
        </div>

        {/* App Section */}
        <div
          className={`rounded-2xl overflow-hidden ${
            isDesktop
              ? "bg-white border border-gray-200 shadow-sm"
              : "bg-surface-alt"
          }`}
        >
          <p
            className={`px-4 pt-4 pb-2 text-xs font-medium uppercase tracking-wide ${
              isDesktop ? "text-gray-500" : "text-text-subtle"
            }`}
          >
            App
          </p>

        {/* Clear cache & restart */}
          {/* <button
            onClick={() => {
            toast.info("Clearing cache and restarting...");
              setTimeout(() => {
                forceClearCacheAndRefresh();
              }, 500);
            }}
            className={`w-full px-4 py-3.5 flex items-center justify-between transition-colors ${
              isDesktop
                ? "hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                : "hover:bg-surface-subtle/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <IoRefreshOutline className="text-blue-500 text-lg" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-text-default">Clear Cache & Restart</p>
                <p className="text-xs text-text-subtle">Restarts the app after clearing cache</p>
              </div>
            </div>
            <IoChevronForward className="text-text-subtle" />
          </button> */}

          <button
            onClick={onLogOut}
            className={`w-full px-4 py-3.5 flex items-center justify-between transition-colors ${
              isDesktop
                ? "hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                : "hover:bg-surface-subtle/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                <IoLogOutOutline className="text-red-500 text-lg" />
              </div>
              <p className="text-sm font-medium text-red-500">Log Out</p>
            </div>
          </button>
        </div>

        {/* App Version */}
        <p className="text-center text-xs text-text-subtle/50 pt-2 pb-6">
          Rift Wallet v{APP_VERSION}
        </p>
      </div>

      <Drawer
        modal
        open={isOpen}
        onClose={() => {
          onClose();
        }}
        onOpenChange={(open) => {
          if (open) {
            onOpen();
          } else {
            onClose();
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader className="hidden">
            <DrawerTitle>Account Recovery</DrawerTitle>
            <DrawerDescription>
              Setup an account recovery method
            </DrawerDescription>
          </DrawerHeader>

          <div className="w-full h-full p-4 pb-6">
            <p className="text-base font-semibold text-text-default">
              Account Recovery
            </p>
            <p className="text-sm text-text-subtle mt-0.5 mb-4">
              Add a backup contact to recover your account
            </p>

            {/* Email Recovery */}
            <div className="mt-2 rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="w-full flex items-center gap-3 p-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  recoveryEmail ? "bg-green-500/10" : "bg-gray-100"
                }`}>
                  <MdAlternateEmail className={`text-lg ${
                    recoveryEmail ? "text-green-500" : "text-text-subtle"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-default">
                    Email Recovery
                  </p>
                  <p className={`text-xs truncate ${recoveryEmail ? "text-green-600" : "text-text-subtle"}`}>
                    {recoveryEmail || "Not configured"}
                  </p>
                </div>
                {recoveryEmail ? (
                  <IoCheckmarkCircle className="text-green-500 text-lg flex-shrink-0" />
                ) : null}
              </div>
              <div className="flex border-t border-gray-100">
                {recoveryEmail ? (
                  <>
                    <button
                      onClick={() => onRecover("email")}
                      className="flex-1 py-2.5 text-xs font-medium text-accent-primary hover:bg-gray-50 transition-colors"
                    >
                      Update
                    </button>
                    <div className="w-px bg-gray-100" />
                    <button
                      onClick={() => onRemoveRecovery("emailRecovery")}
                      disabled={!!removeMethod}
                      className="flex-1 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onRecover("email")}
                    className="flex-1 py-2.5 text-xs font-medium text-accent-primary hover:bg-gray-50 transition-colors"
                  >
                    Add Email
                  </button>
                )}
              </div>
            </div>

            {/* Phone Recovery */}
            <div className="mt-2 rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="w-full flex items-center gap-3 p-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  recoveryPhone ? "bg-green-500/10" : "bg-gray-100"
                }`}>
                  <HiPhone className={`text-lg ${
                    recoveryPhone ? "text-green-500" : "text-text-subtle"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-default">
                    Phone Recovery
                  </p>
                  <p className={`text-xs truncate ${recoveryPhone ? "text-green-600" : "text-text-subtle"}`}>
                    {recoveryPhone || "Not configured"}
                  </p>
                </div>
                {recoveryPhone ? (
                  <IoCheckmarkCircle className="text-green-500 text-lg flex-shrink-0" />
                ) : null}
              </div>
              <div className="flex border-t border-gray-100">
                {recoveryPhone ? (
                  <>
                    <button
                      onClick={() => onRecover("phone")}
                      className="flex-1 py-2.5 text-xs font-medium text-accent-primary hover:bg-gray-50 transition-colors"
                    >
                      Update
                    </button>
                    <div className="w-px bg-gray-100" />
                    <button
                      onClick={() => onRemoveRecovery("phoneRecovery")}
                      disabled={!!removeMethod}
                      className="flex-1 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onRecover("phone")}
                    className="flex-1 py-2.5 text-xs font-medium text-accent-primary hover:bg-gray-50 transition-colors"
                  >
                    Add Phone
                  </button>
                )}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Remove Recovery Verification Drawer */}
      <Drawer
        modal
        open={!!removeMethod}
        onClose={closeRemoveDrawer}
        onOpenChange={(open) => {
          if (!open) closeRemoveDrawer();
        }}
      >
        <DrawerContent>
          <DrawerHeader className="hidden">
            <DrawerTitle>Verify to Remove</DrawerTitle>
            <DrawerDescription>
              Verify your identity to remove recovery method
            </DrawerDescription>
          </DrawerHeader>

          <div className="w-full p-4 pb-6">
            <p className="text-base font-semibold text-text-default">
              Remove Recovery Method
            </p>
            <p className="text-sm text-text-subtle mt-0.5 mb-6">
              Verify your identity to remove this recovery method
            </p>

            {hasPassword ? (
              /* Password verification */
              <div>
                <p className="text-sm mb-2">Enter your password</p>
                <div className="w-full rounded-2xl px-3 py-4 bg-surface-subtle border border-gray-200">
                  <input
                    className="w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
                    placeholder="* * * * * *"
                    type="password"
                    value={removePassword}
                    onChange={(e) => setRemovePassword(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <ActionButton
                    onClick={closeRemoveDrawer}
                    variant="ghost"
                    className="flex-1 rounded-2xl border border-gray-200"
                  >
                    Cancel
                  </ActionButton>
                  <ActionButton
                    variant="secondary"
                    disabled={!removePassword || isRemoving}
                    loading={isRemoving}
                    onClick={handleConfirmRemove}
                    className="flex-1 rounded-2xl bg-red-500 hover:bg-red-600"
                  >
                    Remove
                  </ActionButton>
                </div>
              </div>
            ) : removeOtpStep ? (
              /* OTP verification */
              <div>
                <p className="text-sm text-text-subtle text-center mb-4">
                  Enter the code sent to your{" "}
                  {userIdentifierType === "phone" ? "phone" : "email"}
                </p>

                <div className="flex justify-center mb-4">
                  <InputOTP
                    value={removeOtpCode}
                    onChange={setRemoveOtpCode}
                    maxLength={4}
                    inputMode={userIdentifierType === "email" ? "text" : "numeric"}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <button
                  onClick={() => {
                    if (!userIdentifier || !userIdentifierType) return;
                    setIsSendingRemoveOtp(true);
                    sendOtpMutation
                      .mutateAsync({
                        identifier: userIdentifier,
                        type: userIdentifierType,
                      })
                      .then(() => toast.success("Code resent"))
                      .catch((err: any) =>
                        toast.error(err.message || "Failed to resend code")
                      )
                      .finally(() => setIsSendingRemoveOtp(false));
                  }}
                  disabled={isSendingRemoveOtp}
                  className="w-full text-center text-sm text-accent-primary mb-4 disabled:opacity-50"
                >
                  {isSendingRemoveOtp ? "Sending..." : "Resend code"}
                </button>

                <div className="flex gap-3">
                  <ActionButton
                    onClick={closeRemoveDrawer}
                    variant="ghost"
                    className="flex-1 rounded-2xl border border-gray-200"
                  >
                    Cancel
                  </ActionButton>
                  <ActionButton
                    variant="secondary"
                    disabled={removeOtpCode.length < 4 || isRemoving}
                    loading={isRemoving}
                    onClick={handleConfirmRemove}
                    className="flex-1 rounded-2xl bg-red-500 hover:bg-red-600"
                  >
                    Remove
                  </ActionButton>
                </div>
              </div>
            ) : (
              /* Loading OTP */
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Payment Account Setup Modal */}
      <PaymentAccountSetup
        isOpen={showPaymentSetup}
        onClose={() => setShowPaymentSetup(false)}
        onSave={handleUpdatePaymentAccount}
        currentPaymentAccount={user?.paymentAccount || user?.payment_account}
      />

      {/* Notification Settings Drawer */}
      <Drawer
        modal
        open={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
        onOpenChange={(open) => {
          if (!open) {
            setShowNotificationSettings(false);
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader className="hidden">
            <DrawerTitle>Push Notifications</DrawerTitle>
            <DrawerDescription>
              Manage your push notification settings
            </DrawerDescription>
          </DrawerHeader>

          <div className="w-full h-full p-4 pb-8 overflow-y-auto">
            <NotificationSettings />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Referral Drawer */}
      <Drawer
        modal
        open={showReferralDrawer}
        onClose={() => setShowReferralDrawer(false)}
        onOpenChange={(open) => {
          if (!open) {
            setShowReferralDrawer(false);
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Invite Friends</DrawerTitle>
            <DrawerDescription>
              Share your referral link and earn rewards
            </DrawerDescription>
          </DrawerHeader>

          <div className="w-full p-4 pb-8 space-y-4">
            {/* Referral Code Display */}
            <div className="bg-surface-subtle rounded-xl p-4 text-center">
              <p className="text-xs text-text-subtle mb-1">
                Your Referral Code
              </p>
              <p className="text-2xl font-bold text-accent-primary tracking-widest">
                {referralCode}
              </p>
            </div>

            {/* Referral Link */}
            <div
              onClick={handleCopyReferralLink}
              className="flex items-center gap-2 p-3 bg-surface-subtle rounded-xl cursor-pointer hover:bg-surface transition-colors"
            >
              <p className="flex-1 text-sm text-text-subtle truncate">
                {referralLink}
              </p>
              <div className="p-2 bg-accent-primary/10 rounded-lg">
                <IoCopyOutline className="text-accent-primary" />
              </div>
            </div>

            {/* Share Options */}
            <div className="space-y-2">
              <p className="text-xs text-text-subtle font-medium">Share via</p>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleCopyReferralLink}
                  className="flex flex-col items-center gap-2 p-3 bg-surface-subtle rounded-xl hover:bg-surface transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-500/10 flex items-center justify-center">
                    <IoCopyOutline className="text-gray-500 text-lg" />
                  </div>
                  <span className="text-xs text-text-subtle">Copy</span>
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="flex flex-col items-center gap-2 p-3 bg-surface-subtle rounded-xl hover:bg-surface transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <IoLogoWhatsapp className="text-green-500 text-lg" />
                  </div>
                  <span className="text-xs text-text-subtle">WhatsApp</span>
                </button>

                <button
                  onClick={handleShareTelegram}
                  className="flex flex-col items-center gap-2 p-3 bg-surface-subtle rounded-xl hover:bg-surface transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <FaTelegram className="text-blue-500 text-lg" />
                  </div>
                  <span className="text-xs text-text-subtle">Telegram</span>
                </button>
              </div>

              {/* Native Share Button */}
              <ActionButton
                onClick={handleNativeShare}
                className="w-full py-3 mt-2"
              >
                <IoShareSocialOutline className="text-lg mr-2" />
                Share Link
              </ActionButton>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {isDesktop ? (
        <DesktopPageLayout maxWidth="lg" className="h-full">
          {content}
        </DesktopPageLayout>
      ) : (
        content
      )}
    </div>
  );
}
