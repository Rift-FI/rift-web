import React from "react";
import { Avatar } from "@mui/material";
import { colors } from "../constants";
import "../styles/components/appbar.css";

interface AppBarProps {
  username: string | undefined;
  profileImage: string | undefined;
}

export const ResponsiveAppBar: React.FC<AppBarProps> = ({
  username,
  profileImage,
}) => {
  return (
    <div id="appbarctr">
      <Avatar
        src={profileImage}
        alt={username}
        sx={{
          width: 120,
          height: 120,
        }}
      />

      <div className="uname">
        <p style={{ color: colors.textprimary }}>Hi, {username}</p>
      </div>
    </div>
  );
};
