import { WalletAddress } from "@/lib/entities";
import { shortenString } from "@/lib/utils";
import { WalletIcon, Mail, User, MessageCircle, Globe } from "lucide-react";

interface Props {
  address: WalletAddress;
  onClick?: (address: WalletAddress) => void;
}

const getContactIcon = (type: WalletAddress["type"]) => {
  switch (type) {
    case "address":
      return WalletIcon;
    case "email":
      return Mail;
    case "externalId":
      return User;
    case "telegram-username":
      return MessageCircle;
    case "name-service":
      return Globe;
    default:
      return WalletIcon;
  }
};

const getDisplayName = (address: WalletAddress) => {
  switch (address.type) {
    case "email":
      return address.displayName || address.address.split("@")[0];
    case "externalId":
      return address.displayName || `User ${address.address}`;
    case "telegram-username":
      return `@${address.address}`;
    case "name-service":
      return address.address;
    case "address":
    default:
      return shortenString(address.address);
  }
};

const getSubtitle = (address: WalletAddress) => {
  switch (address.type) {
    case "email":
      return address.address;
    case "externalId":
      return `External ID: ${address.address}`;
    case "telegram-username":
      return "Telegram Contact";
    case "name-service":
      return "ENS Name";
    case "address":
    default:
      return shortenString(address.address);
  }
};

export default function AddressRenderer(props: Props) {
  const { address, onClick } = props;
  const IconComponent = getContactIcon(address.type);

  return (
    <div
      onClick={() => {
        onClick?.(address);
      }}
      className="flex flex-row items-center w-full cursor-pointer active:scale-95"
    >
      <div className="flex flex-row items-center gap-x-3">
        <div className="p-2 rounded-full flex flex-row items-center justify-center bg-secondary">
          <IconComponent className="text-foreground" size={20} />
        </div>
        <div className="flex flex-col w-full">
          <p className="text-white font-semibold">{getDisplayName(address)}</p>
          <p className="text-xs text-muted-foreground">
            {getSubtitle(address)}
          </p>
        </div>
      </div>
    </div>
  );
}
