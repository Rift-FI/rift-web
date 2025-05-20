import { FaQrcode } from "react-icons/fa6";
import { BsSendFill } from "react-icons/bs";
import { PiSwap } from "react-icons/pi";
import { CiLink } from "react-icons/ci";

import { colors } from "@/constants";

const tokenActions = [
  {
    icon: <FaQrcode color={colors.accent} size={24} />,
    label: "Receive",
  },
  {
    icon: <BsSendFill color={colors.accent} size={24} />,
    label: "Send",
  },
  {
    icon: <PiSwap color={colors.accent} size={24} />,
    label: "Swap",
  },
  {
    icon: <CiLink color={colors.accent} size={24} />,
    label: "Link",
  },
];

function TokenActions() {
  return (
    <div className="flex justify-between mx-2 mt-2 gap-2 select-none">
      {tokenActions.map((action) => (
        <div
          key={action.label}
          className="w-24 h-24 rounded-lg flex items-center justify-center bg-accent flex flex-col gap-2"
        >
          {action.icon}
          <p className="text-sm font-medium">{action.label}</p>
        </div>
      ))}
    </div>
  );
}

export default TokenActions;
