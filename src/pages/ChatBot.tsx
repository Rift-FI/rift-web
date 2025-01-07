import { JSX, useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import {
  GetPromptHistory,
  messagesType,
  UseGptPrompt,
} from "../utils/api/chat";
import { SnackBar } from "../components/global/SnackBar";
import { UserMessage, BotMessage } from "../components/chat/Messages";
import { ChatInput } from "../components/chat/ChatInput";
import { LoadingAlt } from "../assets/animations";
import gptlogo from "../assets/images/gpt.png";
import "../styles/pages/chatbot.css";

export default function ChatBot(): JSX.Element {
  const navigate = useNavigate();
  const { conversationId, chatAccessToken, initialMessage, nonce } =
    useParams();

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
      conversationId as string,
      nonce as string
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

  const onGetPromptHistory = useCallback(async () => {
    let access: string | null = localStorage.getItem("token");
    const { history } = await GetPromptHistory(
      access as string,
      conversationId as string
    );

    if (history?.length > 0) {
      let messages: messagesType[] = [];

      history?.map((conv) => {
        let usermessage: messagesType = { role: "user", content: conv.prompt };
        messages.push(usermessage);
        let botmessage: messagesType = {
          role: "assistant",
          content: conv.response,
        };
        messages.push(botmessage);
      });

      setChatMessages(messages);
    }
  }, []);

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

  useEffect(() => {
    onGetPromptHistory();
  }, []);

  return (
    <section id="chatbot">
      <div className="chattitle">
        <div className="logo">
          <img src={gptlogo} alt="gpt" />
          <span>GPT-4o</span>
        </div>

        <p className="desc">
          OpenAI's most powerful model, GPT-4o, provides more natural, engaging
          & tailored writing and overall provides more thorough, insightful
          responses. Supports context window of 128k tokens.
        </p>

        <p className="powered">
          Powered by OpenAI
          <span>{conversationId}</span>
        </p>
      </div>

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
