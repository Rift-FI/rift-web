import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Paperclip, Send, Trash2, MessageSquare } from "lucide-react";

import useWalletAuth from "@/hooks/wallet/use-wallet-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import usericon from "@/assets/user.png";
import sphereicon from "@/assets/sphere.png";
import ChatMessage from "./components/ChatMessage";

interface IForm {
  query: string;
}

const CONVERSATION_CACHE_KEY = "agent-conversation";

const AgentPage = () => {
  const [messages, setMessages] = useState<
    { query: string; response: string; queryAt: Date }[]
  >(() => {
    const cachedConvo = localStorage.getItem(CONVERSATION_CACHE_KEY);
    return cachedConvo ? JSON.parse(cachedConvo) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const { userQuery } = useWalletAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<IForm>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    localStorage.setItem(CONVERSATION_CACHE_KEY, JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const onSubmit = async (data: IForm) => {
    if (!data.query.trim()) return;

    const userMessage = {
      query: data.query,
      response: "",
      queryAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    reset();

    setIsLoading(true);

    try {
      const authToken = localStorage.getItem("token");
      const apiKey = import.meta.env.VITE_SDK_API_KEY;

      if (!authToken || !apiKey) {
        throw new Error("Missing API key or auth token");
      }

      const response = await fetch(
        "https://e0d92fe6ad8a.ngrok.app/agent/query",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "x-auth-token": authToken,
          },
          body: JSON.stringify({ query: data.query }),
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const result = await response.json();
      setMessages((prev) =>
        prev.map((msg) =>
          msg === userMessage ? { ...msg, response: result.response } : msg
        )
      );
    } catch (error) {
      console.error("Error fetching agent response:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg === userMessage
            ? { ...msg, response: "Sorry, I ran into an error." }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  const clearConversation = () => {
    localStorage.removeItem(CONVERSATION_CACHE_KEY);
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-full w-full pb-20 bg-app-background">
      {/* Header */}
      <div className="flex justify-end p-2">
        <Button variant="outline" size="sm" onClick={clearConversation}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>

      {/* Chat Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 flex flex-col">
        {messages.length === 0 && (
          <div className="flex items-center justify-center flex-grow text-center text-muted-foreground">
            <div>
              <MessageSquare size={48} className="mx-auto mb-4" />
              <h2 className="text-lg font-medium">Start a Conversation</h2>
              <p className="text-sm">
                Ask me anything about your crypto portfolio, or tell me to make
                a transaction.
              </p>
            </div>
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className="flex flex-col">
            {/* User Message */}
            <div className="flex items-end justify-end">
              <div className="bg-accent-primary text-white p-3 rounded-l-lg rounded-br-lg max-w-xs">
                <ChatMessage text={msg.query} />
                <p className="text-xs text-right mt-1">
                  {new Date(msg.queryAt).toLocaleTimeString()}
                </p>
              </div>
              <Avatar className="ml-2">
                <AvatarImage src={usericon} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </div>

            {/* Agent Response */}
            {msg.response && (
              <div className="flex items-end mt-2">
                <Avatar className="mr-2">
                  <AvatarImage src={sphereicon} />
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <div className="bg-secondary p-3 rounded-r-lg rounded-bl-lg max-w-xs">
                  <ChatMessage text={msg.response} />
                  <p className="text-xs text-right mt-1">
                    {new Date(msg.queryAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-end mt-2">
            <Avatar className="mr-2">
              <AvatarImage src={sphereicon} />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="bg-secondary p-3 rounded-r-lg rounded-bl-lg">
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex items-center space-x-2 bg-secondary rounded-md px-2"
        >
          <Button variant="ghost" size="icon">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            {...register("query")}
            placeholder="Ask Sphere anything..."
            className="flex-grow bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isSubmitting || isLoading}
            onKeyDown={handleKeyDown}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isSubmitting || isLoading}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AgentPage;
