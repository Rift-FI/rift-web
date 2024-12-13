import React from "react";
import { Avatar } from "@mui/material";
import { useSnackbar } from "../hooks/snackbar";
import { Copy } from "../assets/icons";
import "../styles/components/appbar.css";

interface AppBarProps {
  username: string | undefined;
  profileImage: string | undefined;
  walletAddress: string;
}

const ResponsiveAppBar: React.FC<AppBarProps> = ({
  username,
  profileImage,
  walletAddress,
}) => {
  const { showsuccesssnack } = useSnackbar();

  const onCopyAddr = () => {
    if (walletAddress !== null) {
      navigator.clipboard.writeText(walletAddress as string);
      showsuccesssnack("Wallet address copied to clipboard");
    }
  };

  return (
    <div id="appbarctr">
      <Avatar
        src={profileImage}
        alt={username}
        sx={{
          width: { xs: 42, md: 48 },
          height: { xs: 42, md: 48 },
        }}
      />

      <div className="uname">
        <p>Welcome {username}</p>
        <button onClick={onCopyAddr}>
          {walletAddress?.substring(0, 3)}...{walletAddress?.substring(4, 7)}
          <Copy width={14} height={16} />
        </button>
      </div>
    </div>
  );
};

export default ResponsiveAppBar;
