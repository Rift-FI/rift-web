import { JSX, useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import {
  ChatWithBotFromKey,
  ChatWithBotFromKeyHistory,
  messagesType,
} from "../../utils/api/chat";
import { UserMessage, BotMessage } from "../../components/chat/Messages";
import { ChatInput } from "../../components/chat/ChatInput";
import { LoadingAlt } from "../../assets/animations";
import gptlogo from "../../assets/images/logos/openai.png";
import "../../styles/pages/chatbot.scss";

export default function ChatBotWithKey(): JSX.Element {
  const navigate = useNavigate();
  const { openaikey } = useParams();
  const { switchtab } = useTabs();

  const [botLoading, setBotLoading] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<messagesType[]>([
    { role: "assistant", content: "How may I assist you today?" },
  ]);

  const goBack = () => {
    switchtab("keys");
    navigate("/app");
  };

  const submitPropmt = (userPrompt: string) => {
    setBotLoading(true);

    setChatMessages((prev) => [...prev, { role: "user", content: userPrompt }]);

    ChatWithBotFromKey(openaikey as string, userPrompt).then((res) => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res?.response,
        },
      ]);
      setBotLoading(false);
    });
  };

  const onGetPromptHistory = useCallback(async () => {
    const { history } = await ChatWithBotFromKeyHistory(openaikey as string);

    if (history?.length > 0) {
      let messages: messagesType[] = [];

      history?.map((conv) => {
        let usermessage: messagesType = { role: "user", content: conv?.prompt };
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
    onGetPromptHistory();
  }, []);

  useBackButton(goBack);

  return (
    <section id="chatbot">
      <div className="chattitle">
        <div className="logo">
          <img src={gptlogo} alt="gpt" />
          <span>GPT-4o</span>
        </div>

        <p className="powered">Powered by OpenAI</p>
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
    </section>
  );
}
