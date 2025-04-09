import { JSX } from "react";
import {
  faCircleUser,
  faArrowRight,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import { FaIcon } from "../../assets/faicon";
import { formatUsd } from "../../utils/formatters";
import { useAppDrawer } from "../../hooks/drawer";
import poelogo from "../../assets/images/icons/poe.png";
import polymarketlogo from "../../assets/images/icons/polymarket.png";
import awxlogo from "../../assets/images/awx.png";

interface borrowedSecretProps {
  secret: string;
  secretType: string;
  owner: string;
  secretFee: number;
}

interface lentSecretProps {
  secret: string;
  secretType: string;
  borrower: string;
  secretFee: number;
}

const getSecretImage = (secretType: string) => {
  switch (secretType) {
    case "OPENAI":
    case "POE":
      return poelogo;
    case "POLYMARKET":
      return polymarketlogo;
    default:
      return awxlogo;
  }
};

export const BorrowedSecret = ({
  secret,
  secretType,
  owner,
  secretFee,
}: borrowedSecretProps): JSX.Element => {
  return (
    <div className="bg-[#212121] rounded-2xl p-4 shadow-lg relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300">
      {/* Accent color decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#ffb386]/10 rounded-full -mr-12 -mt-12" />

      <div className="flex justify-between items-start relative">
        {/* Left side - Secret info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
              <img
                src={getSecretImage(secretType)}
                alt={secretType}
                className="w-6 h-6 object-contain"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#212121] rounded-full p-0.5">
              <FaIcon faIcon={faCircleUser} color="#ffb386" fontsize={12} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-[#f6f7f9]">{secret}</span>
              <span className="text-xs text-[#ffb386] px-2 py-0.5 rounded-full bg-[#ffb386]/10">
                {secretType}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-gray-400">from</span>
              <span className="text-sm text-[#ffb386]">@{owner}</span>
            </div>
          </div>
        </div>

        {/* Right side - Fee info */}
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-400">Access Fee</span>
          <span className="text-lg font-bold text-[#f6f7f9]">
            {formatUsd(secretFee)}
          </span>
        </div>
      </div>

      {/* Bottom action button */}
      <div className="mt-4 flex items-center justify-between border-t border-[#2a2a2a] pt-3">
        <span className="text-sm text-gray-400"></span>
        <button className="flex items-center gap-2 text-[#ffb386] hover:bg-[#ffb386]/10 px-3 py-1.5 rounded-lg transition-colors">
          <span className="text-sm">Use Secret</span>
          <FaIcon faIcon={faArrowRight} color="#ffb386" fontsize={12} />
        </button>
      </div>
    </div>
  );
};

export const LentSecret = ({
  secret,
  secretType,
  borrower,
  secretFee,
}: lentSecretProps): JSX.Element => {
  const { openAppDrawerWithKey } = useAppDrawer();

  return (
    <div
      className="bg-[#212121] rounded-2xl p-4 shadow-lg relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300"
      onClick={() =>
        openAppDrawerWithKey("revokesecretaccess", secretType, secretType)
      }
    >
      {/* Accent color decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#ffb386]/10 rounded-full -mr-12 -mt-12" />

      <div className="flex justify-between items-start relative">
        {/* Left side - Secret info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
              <img
                src={getSecretImage(secretType)}
                alt={secretType}
                className="w-6 h-6 object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#212121] rounded-full p-0.5">
              <FaIcon faIcon={faCircleUser} color="#ffb386" fontsize={12} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-[#f6f7f9]">{secret}</span>
              <span className="text-xs text-[#ffb386] px-2 py-0.5 rounded-full bg-[#ffb386]/10">
                {secretType}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-gray-400">to</span>
              <span className="text-sm text-[#ffb386]">@{borrower}</span>
            </div>
          </div>
        </div>

        {/* Right side - Fee info */}
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-400">Access Fee</span>
          <span className="text-lg font-bold text-[#f6f7f9]">
            {formatUsd(secretFee)}
          </span>
        </div>
      </div>

      {/* Bottom action button */}
      <div className="mt-4 flex items-center justify-between border-t border-[#2a2a2a] pt-3">
        <span className="text-sm text-gray-400"></span>
        <button className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors">
          <FaIcon faIcon={faLock} color="#ef4444" fontsize={12} />
          <span className="text-sm">Revoke Access</span>
        </button>
      </div>
    </div>
  );
};
