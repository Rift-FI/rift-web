import { JSX } from "react";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { Avatar } from "@mui/material";
import { ChevronDown } from "../assets/icons";
import { colors } from "../constants";
import spherelogo from "../assets/images/icons/sphere.png";
import "../styles/components/appbar.scss";

export const AppBar = (): JSX.Element => {
  const { initData } = useLaunchParams();

  return (
    <div id="appbar">
      <div className="accounswitch">
        <img src={spherelogo} alt="SPHERE" />

        <span>
          8BM0169rC8 <ChevronDown color={colors.textsecondary} />
        </span>
      </div>

      <Avatar
        src={initData?.user?.photoUrl}
        alt={initData?.user?.username}
        sx={{
          width: 32,
          height: 32,
        }}
      />
    </div>
  );
};
