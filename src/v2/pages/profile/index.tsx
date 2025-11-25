import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  IoWalletOutline,
  IoPersonOutline,
  IoTrophyOutline,
  IoNotificationsOutline,
  IoChevronForward,
  IoShieldCheckmarkOutline,
  IoLogOutOutline,
} from "react-icons/io5";
import { HiMiniUser } from "react-icons/hi2";
import { FaArrowsRotate } from "react-icons/fa6";
import { MdAlternateEmail } from "react-icons/md";
import { HiPhone } from "react-icons/hi";
import { Pencil, Check, X } from "lucide-react";
import { usePlatformDetection } from "@/utils/platform";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import useUser from "@/hooks/data/use-user";
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

export default function Profile() {
  const navigate = useNavigate();
  const { onOpen, onClose, isOpen } = useDisclosure();
  const [showPaymentSetup, setShowPaymentSetup] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] =
    useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);

  const { isTelegram, telegramUser } = usePlatformDetection();
  const { userQuery } = useWalletAuth();
  const { data: user, isLoading: userLoading } = useUser();
  const updateUserMutation = useUpdateUser();

  const { recoveryMethodsQuery } = useWalletRecovery({
    externalId: userQuery?.data?.externalId,
  });

  // Fetch loyalty stats and point value
  const { data: loyaltyStats } = useLoyaltyStats();
  const { data: pointValue } = usePointValue();

  // Debug logging
  useEffect(() => {
    console.log("👤 [Profile] Loyalty stats:", loyaltyStats);
    console.log("👤 [Profile] Should show rewards section:", !!loyaltyStats);
  }, [loyaltyStats]);

  // Initialize display name from user data (handle both camelCase and snake_case)
  const userDisplayName = user?.displayName || user?.display_name;
  if (userDisplayName && !displayName) {
    setDisplayName(userDisplayName);
  }

  const handleUpdatePaymentAccount = async (paymentAccount: string) => {
    try {
      await updateUserMutation.mutateAsync({ paymentAccount });
      toast.success("Withdrawal account updated successfully!");
    } catch (error) {
      console.error("Error updating payment account:", error);
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
      console.error("Error updating display name:", error);
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
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-full overflow-y-auto mb-18"
    >
      {/* Profile Header - Compact */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-4">
          {isTelegram ? (
            <Avatar className="w-16 h-16 min-w-16 min-h-16 border-2 border-accent-primary/20">
              <AvatarImage
                className="rounded-full"
                src={telegramUser?.photoUrl}
                alt={telegramUser?.username}
              />
              <AvatarFallback className="bg-accent-primary/10 text-accent-primary text-xl">
                {telegramUser?.username?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-16 h-16 min-w-16 min-h-16 rounded-full bg-accent-primary/10 border-2 border-accent-primary/20 flex items-center justify-center flex-shrink-0">
              <HiMiniUser className="text-3xl text-accent-primary" />
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
                  className="flex-1 min-w-0 bg-surface-subtle text-text-default text-lg font-semibold placeholder:text-text-subtle outline-none px-3 py-1.5 rounded-lg border border-surface"
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
                <span className="text-xl font-semibold text-text-default">
                  {userDisplayName || "Set your name"}
                </span>
                <Pencil className="w-3.5 h-3.5 text-text-subtle" />
              </button>
            )}
            <p className="text-sm text-text-subtle mt-0.5">Profile Settings</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-6 space-y-4">
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
                <p className="text-sm font-semibold text-text-default">Rift Points</p>
                <p className="text-xs text-text-subtle">
                  {formatNumberWithCommas(loyaltyStats.totalPoints)} points
                  {pointValue && ` • $${(loyaltyStats.totalPoints * pointValue.pointValue).toFixed(2)}`}
                </p>
              </div>
            </div>
            <IoChevronForward className="text-text-subtle" />
          </button>
        )}

        {/* Settings Sections */}
        <div className="bg-app-background rounded-xl shadow-sm border border-surface-subtle overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-medium text-text-subtle uppercase tracking-wide">Account</p>
          
          {/* Withdrawal Account */}
          <button
            onClick={() => setShowPaymentSetup(true)}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-surface-subtle/50 transition-colors border-b border-surface-subtle"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <IoWalletOutline className="text-blue-500 text-lg" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-text-default">Withdrawal Account</p>
                <p className="text-xs text-text-subtle">
                  {(() => {
                    const paymentAccount = user?.paymentAccount || user?.payment_account;
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
                <p className="text-sm font-medium text-text-default">Push Notifications</p>
                <p className="text-xs text-text-subtle">Manage alerts</p>
              </div>
            </div>
            <IoChevronForward className="text-text-subtle" />
          </button>
        </div>

        {/* Security Section */}
        <div className="bg-app-background rounded-xl shadow-sm border border-surface-subtle overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-medium text-text-subtle uppercase tracking-wide">Security</p>
          
          {userQuery?.data?.externalId && (
            <button
              onClick={onAddRecovery}
              className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-surface-subtle/50 transition-colors border-b border-surface-subtle"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <IoShieldCheckmarkOutline className="text-green-500 text-lg" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-text-default">Account Recovery</p>
                  <p className="text-xs text-text-subtle">Backup your account</p>
                </div>
              </div>
              <IoChevronForward className="text-text-subtle" />
            </button>
          )}

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
        <p className="text-center text-xs text-text-subtle/50 pt-2">
          Rift Wallet v1.0
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
    </motion.div>
  );
}
