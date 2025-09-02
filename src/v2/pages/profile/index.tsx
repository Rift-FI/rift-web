import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { GoCopy } from "react-icons/go";
import { IoTrashOutline } from "react-icons/io5";
import { HiMiniUser } from "react-icons/hi2";
import { IoIosPower } from "react-icons/io";
import { FaArrowsRotate } from "react-icons/fa6";
import { MdAlternateEmail } from "react-icons/md";
import { HiPhone } from "react-icons/hi";
import { QrCode } from "lucide-react";
import { usePlatformDetection } from "@/utils/platform";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ActionButton from "@/components/ui/action-button";
import { useDisclosure } from "@/hooks/use-disclosure";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import useWalletRecovery from "@/hooks/wallet/use-wallet-recovery";

export default function Profile() {
  const navigate = useNavigate();
  const { onOpen, onClose, isOpen } = useDisclosure();
  const { isTelegram, telegramUser } = usePlatformDetection();
  const { userQuery } = useWalletAuth();
  const { recoveryMethodsQuery } = useWalletRecovery({
    externalId: userQuery?.data?.externalId,
  });

  const onLogOut = () => {
    localStorage.clear();
    navigate("/auth");
  };

  const onCopyIdentifier = () => {
    const value =
      userQuery?.data?.phoneNumber ??
      userQuery?.data?.email ??
      userQuery?.data?.externalId;

    window.navigator.clipboard.writeText(value as string);
    toast.success("Copied to clipboard");
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

  const onClearConversations = () => {
    localStorage.removeItem("agent-conversation");
    toast.success("Conversation was cleared successfully");
  };

  const onOpenWalletConnect = () => {
    navigate("/app/walletconnect");
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

      <p className="mt-3 text-sm text-muted-foreground">
        {userQuery?.data?.phoneNumber
          ? "Phone Number"
          : userQuery?.data?.email
          ? "Email Address"
          : "Username"}
      </p>
      <div className="w-full bg-accent/10 mt-2 rounded-lg border-1 border-surface-subtle">
        <ActionButton
          onClick={onCopyIdentifier}
          className="w-full bg-transparent p-3 py-4 rounded-none"
        >
          <span className="w-full flex flex-row items-center justify-between">
            <span className="text-text-subtle">
              {userQuery?.data?.phoneNumber ??
                userQuery?.data?.email ??
                userQuery?.data?.externalId}
            </span>
            <GoCopy className="text-text-subtle text-xl" />
          </span>
        </ActionButton>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        AI Conversation History
      </p>
      <div className="w-full bg-accent/10 mt-2 rounded-lg border-1 border-surface-subtle">
        <ActionButton
          onClick={onClearConversations}
          className="w-full bg-transparent p-3 py-4 rounded-none"
        >
          <span className="w-full flex flex-row items-center justify-between">
            <span className="text-text-subtle">Clear Conversation History</span>
            <IoTrashOutline className="text-danger text-xl" />
          </span>
        </ActionButton>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">WalletConnect</p>
      <div className="w-full bg-accent/10 mt-2 rounded-lg border-1 border-surface-subtle">
        <ActionButton
          onClick={onOpenWalletConnect}
          className="w-full bg-transparent p-3 py-4 rounded-none"
        >
          <span className="w-full flex flex-row items-center justify-between">
            <span className="text-text-subtle">Connect to dApps</span>
            <QrCode className="text-text-subtle text-lg" />
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
    </motion.div>
  );
}
