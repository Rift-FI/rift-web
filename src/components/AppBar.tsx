import { JSX } from "react";
import { usePlatformDetection } from "../utils/platform";
import { useNavigate } from "react-router";
import { Avatar } from "@mui/material";
import spherelogo from "../assets/images/icons/sphere.png";
import "../styles/components/appbar.scss";
import Feedback from "./feedback";

export const AppBar = (): JSX.Element => {
  const { isTelegram, telegramUser } = usePlatformDetection();
  const navigate = useNavigate();

  const ethaddress = localStorage.getItem("ethaddress");

  const goToProfile = () => {
    navigate("/profile");
  };

  return (
    <div id="appbar">
      <div className="flex flex-row items-center justify-between gap-2">
        <div className="accounswitch">
          <img src={spherelogo} alt="SPHERE" />

          <span>{ethaddress?.substring(3, 11)}</span>
        </div>
        <Feedback />
      </div>

      <Avatar
        src={isTelegram ? telegramUser?.photoUrl : undefined}
        alt={isTelegram ? telegramUser?.username : "User"}
        sx={{
          width: 32,
          height: 32,
        }}
        onClick={goToProfile}
      />
    </div>
  );
};
