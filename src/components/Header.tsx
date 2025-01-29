import { JSX } from "react";
import { useSnackbar } from "../hooks/snackbar";
import "../styles/constants.css";
import ethSVG from "../assets/images/eth.png";
import "../styles/components/header.css";

interface headerProps {
  walletAddress?: string;
}

export const AppHeader = ({ walletAddress }: headerProps): JSX.Element => {
  const { showsuccesssnack } = useSnackbar();

  const onCopyAddr = () => {
    navigator.clipboard.writeText(walletAddress as string);
    showsuccesssnack("Wallet address copied to clipboard");
  };

  return (
    <div id="appheader">
      <button className="copyaddr" type="button" onClick={onCopyAddr}>
        <img src={ethSVG} alt="ethereum" />

        <span>
          {walletAddress?.substring(0, 3)}...{walletAddress?.substring(4, 7)}
        </span>
      </button>
    </div>
  );
};
