import { useNavigate } from "react-router";
import { toast } from "sonner";
import { GoCopy } from "react-icons/go";
import { IoIosPower } from "react-icons/io";
import { MdOutlinePhone } from "react-icons/md";
import { MdOutlineAlternateEmail } from "react-icons/md";
import { usePlatformDetection } from "@/utils/platform";
import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ActionButton from "@/components/ui/action-button";
import spherelogo from "@/assets/sphere.png";

export default function Profile() {
  const navigate = useNavigate();
  const { isTelegram, telegramUser } = usePlatformDetection();
  const { userQuery } = useWalletAuth();

  const onLogOut = () => {
    localStorage.clear();
    navigate("/auth");
  };

  const onCopy = (value: string) => {
    window.navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="w-full h-full overflow-y-auto mb-18 p-4">
      <div className="flex flex-row items-center justify-center mt-20">
        <Avatar className="size-24 bg-red-50">
          <AvatarImage
            className="rounded-full"
            src={isTelegram ? telegramUser?.photoUrl : spherelogo}
            alt={
              isTelegram
                ? telegramUser?.username
                : userQuery?.data?.externalId ?? userQuery?.data?.email
            }
          />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>

      <div className="w-full bg-secondary mt-4 rounded-lg">
        <ActionButton
          onClick={() => onCopy(userQuery?.data?.externalId ?? "")}
          className="w-full bg-transparent px-3 border-b-2 border-surface-subtle rounded-none"
        >
          <span className="w-full flex flex-row items-center justify-between">
            <span className="text-text-subtle">
              {userQuery?.data?.externalId ?? "ID"}
            </span>
            <GoCopy className="text-text-subtle text-xl" />
          </span>
        </ActionButton>

        <ActionButton
          onClick={() => onCopy(userQuery?.data?.phoneNumber ?? "")}
          className="w-full bg-transparent px-2 py-3 border-b-2 border-surface-subtle rounded-none"
        >
          <span className="w-full flex flex-row items-center justify-between">
            <span className="text-text-subtle">
              {userQuery?.data?.phoneNumber ?? "You do not have a phone number"}
            </span>
            <MdOutlinePhone className="text-text-subtle text-xl" />
          </span>
        </ActionButton>

        <ActionButton
          onClick={() => onCopy(userQuery?.data?.email ?? "")}
          className="w-full bg-transparent p-3 rounded-none"
        >
          <span className="w-full flex flex-row items-center justify-between">
            <span className="text-text-subtle">
              {userQuery?.data?.email ?? "You do not have an email address"}
            </span>
            <MdOutlineAlternateEmail className="text-text-subtle text-xl" />
          </span>
        </ActionButton>
      </div>

      <div className="w-full bg-secondary mt-4 rounded-lg">
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
