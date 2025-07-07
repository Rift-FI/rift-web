import { useNavigate } from "react-router";
import { toast } from "sonner";
import { GoCopy } from "react-icons/go";
import { IoIosPower } from "react-icons/io";
import { FaArrowsRotate } from "react-icons/fa6";
import { MdAlternateEmail } from "react-icons/md";
import { HiPhone } from "react-icons/hi";
import { usePlatformDetection } from "@/utils/platform";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ActionButton from "@/components/ui/action-button";
import usericon from "@/assets/user.png";
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

  const onRecover = (method: string) => {
    onClose();
    navigate(`/app/profile/recovery/${method}`);
  };

  return (
    <div className="w-full h-full overflow-y-auto mb-18 p-4">
      <div className="flex flex-row items-center justify-center mt-20">
        <Avatar className="size-24 border-1 border-accent-primary p-[0.25rem]">
          <AvatarImage
            className="rounded-full"
            src={isTelegram ? telegramUser?.photoUrl : usericon}
            alt={
              isTelegram
                ? telegramUser?.username
                : userQuery?.data?.externalId ?? userQuery?.data?.email
            }
          />
          <AvatarFallback>
            {userQuery?.data?.phoneNumber ??
              userQuery?.data?.email ??
              userQuery?.data?.externalId}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="w-full bg-secondary mt-4 rounded-lg">
        <ActionButton
          onClick={onCopyIdentifier}
          className="w-full bg-transparent p-3 rounded-none"
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

      <div className="w-full bg-secondary mt-4 rounded-lg">
        {userQuery?.data?.externalId && (
          <ActionButton
            onClick={onAddRecovery}
            className="w-full bg-transparent p-3 rounded-none border-b-2 border-surface-subtle"
          >
            <span className="w-full flex flex-row items-center justify-between">
              <span className="text-text-subtle">Account Recovery</span>
              <FaArrowsRotate className="text-text-subtle text-xl" />
            </span>
          </ActionButton>
        )}

        <ActionButton
          onClick={onLogOut}
          className="w-full bg-transparent p-3 rounded-none"
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
            <p className="text-lg font-semibold">
              Account Recovery <br />
              <span className="text-sm font-medium">
                Setup an account recovery method
              </span>
            </p>

            <ActionButton
              onClick={() => onRecover("email")}
              className="w-full bg-transparent p-3 mt-4 rounded-lg border-2 border-surface-subtle"
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
              className="w-full bg-transparent p-3 mt-4 rounded-lg border-2 border-surface-subtle"
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
    </div>
  );
}
