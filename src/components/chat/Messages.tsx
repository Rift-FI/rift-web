import { JSX } from "react";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { Avatar } from "@mui/material";
import { ChatBot } from "../../assets/icons";
import { colors } from "../../constants";
import "../../styles/components/chat/messages.css";

interface messageprops {
  message: string;
}

export const UserMessage = ({ message }: messageprops): JSX.Element => {
  const { initData } = useLaunchParams();

  return (
    <div className="usermessage">
      <p>{message}</p>
      <Avatar
        src={initData?.user?.photoUrl}
        alt={initData?.user?.username}
        sx={{
          width: 28,
          height: 28,
        }}
      />
    </div>
  );
};

export const BotMessage = ({ message }: messageprops): JSX.Element => {
  return (
    <div className="botmessage">
      <span>
        <ChatBot color={colors.textsecondary} />
      </span>
      <p>{message}</p>
    </div>
  );
};
