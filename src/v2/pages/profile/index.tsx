import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  IoWalletOutline,
  IoPersonOutline,
  IoTrophyOutline,
  IoNotificationsOutline,
} from "react-icons/io5";
import { HiMiniUser } from "react-icons/hi2";
import { IoIosPower } from "react-icons/io";
import { FaArrowsRotate } from "react-icons/fa6";
import { MdAlternateEmail } from "react-icons/md";
import { HiPhone } from "react-icons/hi";
import { usePlatformDetection } from "@/utils/platform";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import useUser from "@/hooks/data/use-user";
import useUpdateUser from "@/hooks/data/use-update-user";
import useLoyaltyStats from "@/hooks/data/use-loyalty-stats";
import usePointValue from "@/hooks/data/use-point-value";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ActionButton from "@/components/ui/action-button";
import PaymentAccountSetup from "@/components/ui/payment-account-setup";
import {
  NotificationSettings,
  NotificationDebug,
} from "@/components/notifications";
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
      className="w-full h-full overflow-y-auto mb-18 p-4"
    >
      <div className="flex flex-row items-center justify-center mt-20">
        {isTelegram ? (
          <Avatar className="size-24 border-1 border-accent-primary p-[0.25rem]">
            <AvatarImage
              className="rounded-full"
              src={telegramUser?.photoUrl}
              alt={telegramUser?.username}
            />
            <AvatarFallback>{telegramUser?.username}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex flex-row items-center justify-center border-1 border-accent-primary/10 p-[0.25rem] rounded-full w-30 h-30">
            <HiMiniUser className="text-6xl text-accent-primary" />
          </div>
        )}
      </div>

      {/* Display Name Section */}
      <p className="mt-6 text-sm text-muted-foreground">Display Name</p>
      <div className="w-full bg-accent/10 mt-2 rounded-lg border-1 border-surface-subtle">
        {isEditingName ? (
          <div className="p-3 space-y-3">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name"
              className="w-full p-2 bg-surface-subtle border border-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
              autoFocus
            />
            <div className="flex gap-2">
              <ActionButton
                onClick={handleUpdateDisplayName}
                disabled={updateUserMutation.isPending}
                className="flex-1"
              >
                {updateUserMutation.isPending ? "Saving..." : "Save"}
              </ActionButton>
              <ActionButton
                onClick={() => {
                  setIsEditingName(false);
                  setDisplayName(userDisplayName || "");
                }}
                className="flex-1 bg-surface-subtle text-text-subtle"
              >
                Cancel
              </ActionButton>
            </div>
          </div>
        ) : (
          <ActionButton
            onClick={() => setIsEditingName(true)}
            className="w-full bg-transparent p-3 py-4 rounded-none"
          >
            <span className="w-full flex flex-row items-center justify-between">
              <span className="text-text-subtle">
                {userDisplayName || "Set display name"}
              </span>
              <IoPersonOutline className="text-text-subtle text-xl" />
            </span>
          </ActionButton>
        )}
      </div>

      {/* Rift Points Section */}
      {loyaltyStats && loyaltyStats.totalPoints !== undefined && (
        <>
          <p className="mt-6 text-sm text-muted-foreground">Rewards</p>
          <div className="w-full bg-accent/10 border-1 border-surface-subtle mt-2 rounded-lg">
            <ActionButton
              onClick={() => navigate("/app/profile/loyalty")}
              className="w-full bg-transparent p-3 py-4 rounded-none"
            >
              <span className="w-full flex flex-row items-center justify-between">
                <div className="text-left">
                  <span className="text-text-default block font-medium">
                    Rift Points
                  </span>
                  <span className="text-xs text-text-subtle/70">
                    {formatNumberWithCommas(loyaltyStats.totalPoints)} points
                    {pointValue &&
                      ` • $${(
                        loyaltyStats.totalPoints * pointValue.pointValue
                      ).toFixed(2)} USD`}
                  </span>
                </div>
                <IoTrophyOutline className="text-accent-primary text-xl" />
              </span>
            </ActionButton>
          </div>
        </>
      )}

      {/* Withdrawal Settings Section */}
      <p className="mt-6 text-sm text-muted-foreground">Withdrawal Settings</p>
      <div className="space-y-3 mt-2">
        {/* Payment Account Setup */}
        <ActionButton
          onClick={() => setShowPaymentSetup(true)}
          className="w-full bg-accent/10 border-1 border-surface-subtle p-3 py-4"
        >
          <span className="w-full flex flex-row items-center justify-between">
            <div className="text-left">
              <span className="text-text-subtle block">Withdrawal Account</span>
              {(() => {
                const paymentAccount =
                  user?.paymentAccount || user?.payment_account;
                if (paymentAccount) {
                  try {
                    const account = JSON.parse(paymentAccount);
                    return (
                      <span className="text-xs text-text-subtle/70">
                        {account.institution}{" "}
                        {account.type ? `(${account.type})` : ""}:{" "}
                        {account.accountIdentifier}
                        {account.accountNumber
                          ? ` - ${account.accountNumber}`
                          : ""}
                        {account.accountName ? ` - ${account.accountName}` : ""}
                      </span>
                    );
                  } catch {
                    return (
                      <span className="text-xs text-text-subtle/70">
                        Account configured
                      </span>
                    );
                  }
                } else {
                  return (
                    <span className="text-xs text-text-subtle/70">
                      Not configured
                    </span>
                  );
                }
              })()}
            </div>
            <IoWalletOutline className="text-text-subtle text-xl" />
          </span>
        </ActionButton>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">Notifications</p>
      <div className="w-full bg-accent/10 border-1 border-surface-subtle mt-2 rounded-lg">
        <ActionButton
          onClick={() => setShowNotificationSettings(true)}
          className="w-full bg-transparent p-3 py-4 rounded-none"
        >
          <span className="w-full flex flex-row items-center justify-between">
            <span className="text-text-subtle">Push Notifications</span>
            <IoNotificationsOutline className="text-text-subtle text-xl" />
          </span>
        </ActionButton>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">Security</p>
      <div className="w-full bg-accent/10 border-1 border-surface-subtle mt-2 rounded-lg">
        {userQuery?.data?.externalId && (
          <ActionButton
            onClick={onAddRecovery}
            className="w-full bg-transparent p-3 py-4 rounded-none border-b-1 border-surface-subtle"
          >
            <span className="w-full flex flex-row items-center justify-between">
              <span className="text-text-subtle">Account Recovery</span>
              <FaArrowsRotate className="text-text-subtle text-xl" />
            </span>
          </ActionButton>
        )}

        <ActionButton
          onClick={onLogOut}
          className="w-full bg-transparent p-3 py-4 rounded-none"
        >
          <span className="w-full flex flex-row items-center justify-between">
            <span className="text-text-subtle">Log Out</span>
            <IoIosPower className="text-danger text-2xl" />
          </span>
        </ActionButton>
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

            {/* Debug panel - remove in production */}
            {import.meta.env.MODE === "development" && <NotificationDebug />}
          </div>
        </DrawerContent>
      </Drawer>
    </motion.div>
  );
}
