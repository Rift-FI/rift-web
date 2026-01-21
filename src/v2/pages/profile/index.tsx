import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  IoWalletOutline,
  IoTrophyOutline,
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
import { Pencil, Check, X, Gift } from "lucide-react";
import { usePlatformDetection } from "@/utils/platform";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import useUser from "@/hooks/data/use-user";
import useKYCStatus from "@/hooks/data/use-kyc-status";
import useUpdateUser from "@/hooks/data/use-update-user";
import useLoyaltyStats from "@/hooks/data/use-loyalty-stats";
import usePointValue from "@/hooks/data/use-point-value";
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
import { formatNumberWithCommas } from "@/lib/utils";
import { generateReferralCode, getReferralLink } from "@/utils/referral";
import { useOnboardingDemo } from "@/contexts/OnboardingDemoContext";
import { forceClearCacheAndRefresh, APP_VERSION } from "@/utils/auto-update";

export default function Profile() {
  const navigate = useNavigate();
  const { onOpen, onClose, isOpen } = useDisclosure();
  const [showPaymentSetup, setShowPaymentSetup] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] =
    useState(false);
  const [showReferralDrawer, setShowReferralDrawer] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  const { isTelegram, telegramUser } = usePlatformDetection();
  const { userQuery } = useWalletAuth();
  const { data: user, isLoading: userLoading } = useUser();
  const updateUserMutation = useUpdateUser();
  const {
    isKYCVerified,
    isUnderReview,
    isLoading: kycLoading,
  } = useKYCStatus();

  const { recoveryMethodsQuery } = useWalletRecovery({
    externalId: userQuery?.data?.externalId,
  });

  // Fetch loyalty stats and point value
  const { data: loyaltyStats } = useLoyaltyStats();
  const { data: pointValue } = usePointValue();

  // Onboarding demo
  const { startDemo } = useOnboardingDemo();

  // Initialize display name from user data (handle both camelCase and snake_case)
  const userDisplayName = user?.displayName || user?.display_name;
  if (userDisplayName && !displayName) {
    setDisplayName(userDisplayName);
  }

  // Initialize or load referral code
  useEffect(() => {
    const storedCode = localStorage.getItem("referral_code");
    if (storedCode) {
      setReferralCode(storedCode);
    } else {
      const newCode = generateReferralCode();
      localStorage.setItem("referral_code", newCode);
      setReferralCode(newCode);
    }
  }, []);

  const referralLink = getReferralLink(referralCode);

  const handleCopyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success("Referral link copied!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Join me on Rift - your global USD account for payments, transfers & wealth building!\n\n${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleShareTelegram = () => {
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
    localStorage.clear();
    navigate("/auth");
  };

  const onAddRecovery = () => {
    onOpen();
  };

  const onRecover = (method: "phone" | "email") => {
    if (
      (method == "phone" &&
        recoveryMethodsQuery?.data?.recoveryOptions?.phone) ||
      (method == "email" && recoveryMethodsQuery?.data?.recoveryOptions?.email)
    ) {
      toast.success("Your'e all set");
    } else {
      onClose();
      navigate(`/app/profile/recovery/${method}`);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Profile Header - Fixed at top */}
      <motion.div
        initial={{ x: -4, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="flex-shrink-0 z-20 bg-app-background border-b border-surface-subtle"
      >
        <div className="px-4 pt-6 pb-4">
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
                    className="flex-1 min-w-0 bg-surface-subtle text-text-default text-base font-semibold placeholder:text-text-subtle outline-none px-3 py-1.5 rounded-lg border border-surface"
                    autoFocus
                  />
                  <button
                    onClick={handleUpdateDisplayName}
                    disabled={updateUserMutation.isPending}
                    className="p-2 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors flex-shrink-0"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false);
                      setDisplayName(userDisplayName || "");
                    }}
                    className="p-2 bg-surface-subtle rounded-lg hover:bg-surface transition-colors flex-shrink-0"
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 space-y-4">
        {/* Rift Points Card */}
        {loyaltyStats && loyaltyStats.totalPoints !== undefined && (
          <button
            onClick={() => navigate("/app/profile/loyalty")}
            className="w-full bg-app-background rounded-xl p-4 shadow-lg border border-surface-subtle flex items-center justify-between hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                <IoTrophyOutline className="text-white text-lg" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-text-default">
                  Rift Points
                </p>
                <p className="text-xs text-text-subtle">
                  {formatNumberWithCommas(loyaltyStats.totalPoints)} points
                  {pointValue &&
                    ` • $${(
                      loyaltyStats.totalPoints * pointValue.pointValue
                    ).toFixed(2)}`}
                </p>
              </div>
            </div>
            <IoChevronForward className="text-text-subtle" />
          </button>
        )}

        {/* Settings Sections */}
        <div className="bg-surface-alt rounded-xl overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-medium text-text-subtle uppercase tracking-wide">
            Account
          </p>

          {/* Withdrawal Account */}
          <button
            onClick={() => setShowPaymentSetup(true)}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-surface-subtle/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
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
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-surface-subtle/50 transition-colors"
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
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-surface-subtle/50 transition-colors"
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
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-surface-subtle/50 transition-colors"
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
        </div>

        {/* Compliance Section */}
        <div className="bg-surface-alt rounded-xl overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-medium text-text-subtle uppercase tracking-wide">
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
        <div className="bg-surface-alt rounded-xl overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-medium text-text-subtle uppercase tracking-wide">
            App
          </p>

          {/* Clear Cache - for users with loading issues */}
          <button
            onClick={() => {
              toast.info("Clearing cache and refreshing...");
              setTimeout(() => {
                forceClearCacheAndRefresh();
              }, 500);
            }}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-surface-subtle/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <IoRefreshOutline className="text-blue-500 text-lg" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-text-default">Clear Cache & Refresh</p>
                <p className="text-xs text-text-subtle">Fix loading issues</p>
              </div>
            </div>
            <IoChevronForward className="text-text-subtle" />
          </button>

          <button
            onClick={onLogOut}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-surface-subtle/50 transition-colors"
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

          <div className="w-full h-full p-4">
            <p className="text-md font-medium">
              Account Recovery <br />
              <span className="text-sm font-light">
                Setup an account recovery method
              </span>
            </p>

            <ActionButton
              onClick={() => onRecover("email")}
              className="w-full bg-transparent p-3.5 mt-4 rounded-lg border-1 border-surface-subtle"
            >
              <span className="w-full flex flex-row items-center justify-between">
                <span className="text-text-subtle">
                  {recoveryMethodsQuery?.data?.recoveryOptions?.email ??
                    "Add an Email Address"}
                </span>
                <MdAlternateEmail className="text-text-subtle text-xl" />
              </span>
            </ActionButton>

            <ActionButton
              onClick={() => onRecover("phone")}
              className="w-full bg-transparent p-3.5 mt-4 rounded-lg border-1 border-surface-subtle"
            >
              <span className="w-full flex flex-row items-center justify-between">
                <span className="text-text-subtle">
                  {recoveryMethodsQuery?.data?.recoveryOptions?.phone ??
                    "Add a Phone Number"}
                </span>
                <HiPhone className="text-text-subtle text-xl" />
              </span>
            </ActionButton>
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
    </div>
  );
}
