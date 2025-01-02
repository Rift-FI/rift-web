import { JSX, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { messagesType, UseGptPrompt } from "../utils/api/chat";
import { SnackBar } from "../components/global/SnackBar";
import { UserMessage, BotMessage } from "../components/chat/Messages";
import { ChatInput } from "../components/chat/ChatInput";
import { LoadingAlt } from "../assets/animations";
import { ChatBot as ChatBotIcon } from "../assets/icons";
import { colors } from "../constants";
import "../styles/pages/chatbot.css";

export default function ChatBot(): JSX.Element {
  const navigate = useNavigate();
  const { conversationId, chatAccessToken, initialMessage } = useParams();

  const [botLoading, setBotLoading] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<messagesType[]>([
    { role: "assistant", content: initialMessage as string },
  ]);

  const submitPropmt = (userPrompt: string) => {
    setBotLoading(true);

    setChatMessages((prev) => [...prev, { role: "user", content: userPrompt }]);
    let access: string | null = localStorage.getItem("token");

    UseGptPrompt(
      access as string,
      chatAccessToken as string,
      userPrompt,
      conversationId as string
    )
      .then((res) => {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: res?.message,
          },
        ]);
        setBotLoading(false);
      })
      .catch(() => {
        setBotLoading(false);
      });
  };

  // const onGetPromptHistory = useCallback(async () => {
  //   let access: string | null = localStorage.getItem("token");
  //   await GetPromptHistory(access as string, conversationId as string);
  // }, []);

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(() => navigate("/"));
    }

    return () => {
      backButton.unmount();
    };
  }, []);

  // useEffect(() => {
  //   onGetPromptHistory();
  // }, []);

  return (
    <section id="chatbot">
      <p className="chattitle">
        <ChatBotIcon width={20} height={20} color={colors.textprimary} /> <br />
        <span>{conversationId}</span>
      </p>

      <div className="messages">
        {chatMessages.map((message, index) =>
          message?.role == "user" ? (
            <UserMessage
              key={Math.floor(Math.random() * 1000) + index}
              message={message?.content}
            />
          ) : (
            <BotMessage
              key={Math.floor(Math.random() * 2000) - index}
              message={message?.content}
            />
          )
        )}
        {botLoading && <LoadingAlt width="3rem" height="3rem" />}
      </div>

      <ChatInput promptLoading={false} onSubmitPrompt={submitPropmt} />
      <SnackBar />
    </section>
  );
}
