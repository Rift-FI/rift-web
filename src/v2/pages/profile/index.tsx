import { useNavigate } from "react-router";
import { toast } from "sonner";
import { GoCopy } from "react-icons/go";
import { IoIosPower } from "react-icons/io";
import { usePlatformDetection } from "@/utils/platform";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ActionButton from "@/components/ui/action-button";
import usericon from "@/assets/user.png";

export default function Profile() {
  const navigate = useNavigate();
  const { isTelegram, telegramUser } = usePlatformDetection();
  const { userQuery } = useWalletAuth();

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
          className="w-full bg-transparent p-3 border-b-2 border-surface-subtle rounded-none"
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
    </div>
  );
}
