import React, { useState, useEffect, useRef, LegacyRef } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";
import { TbChartBubbleFilled } from "react-icons/tb";
import { RiRobot3Fill } from "react-icons/ri";
import { FiArrowLeft } from "react-icons/fi";
import { IoArrowUpCircle } from "react-icons/io5";
import { AiOutlineUser } from "react-icons/ai";
import useAnalaytics from "@/hooks/use-analytics";
import { usePlatformDetection } from "@/utils/platform";
import { useWalletAgent } from "@/hooks/agent/use-wallet-agent";
import { Button } from "@/components/ui/button";
import ActionButton from "@/components/ui/action-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TemplateAction from "./components/TemplateAction";
import ChatMessage from "./components/ChatMessage";
import { cn, dateDistance } from "@/lib/utils";

const chatSchema = z.object({
  userQuery: z.string().optional(),
});

type CHAT_SCHEMA_TYPE = z.infer<typeof chatSchema>;

const CONVERSATION_CACHE_KEY = "agent-conversation";

export default function Agent() {
  const navigate = useNavigate();
  const { logEvent } = useAnalaytics();
  const { agentChatMutation } = useWalletAgent();
  const { isTelegram, telegramUser } = usePlatformDetection();

  const chat_input_ref: LegacyRef<HTMLInputElement> = useRef(null!);

  const chat_form = useForm<CHAT_SCHEMA_TYPE>({
    resolver: zodResolver(chatSchema),
    defaultValues: {
      userQuery: "",
    },
  });

  const USER_QUERY = chat_form.watch("userQuery");

  const _cached_conversation = localStorage.getItem(CONVERSATION_CACHE_KEY);
  const _cached_messages: message[] = _cached_conversation
    ? JSON.parse(_cached_conversation)
    : [];
  let messages: message[] = _cached_messages;

  const onSubmitQuery = () => {
    const user_message = {
      query: USER_QUERY!,
      response: "",
      queryAt: new Date(),
    };
    messages.push(user_message);

    agentChatMutation
      .mutateAsync({ userquery: USER_QUERY! })
      .then((res) => {
        messages.push({ ...user_message, response: res?.response });
        logEvent("USE_AGENT_ACTION");
      })
      .catch(() => {
        toast.error("We couldn't complete the action, please try again");
      });
  };

  const goBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    localStorage.setItem(CONVERSATION_CACHE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    logEvent("PAGE_VISIT_AGENT");
  }, []);

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="flex flex-col h-full w-full px-4"
    >
      <Button
        onClick={goBack}
        variant="ghost"
        className="fixed top-4 left-4 w-[2.25rem] h-[2.25rem] rounded-full cursor-pointer bg-accent z-20"
      >
        <FiArrowLeft className="text-4xl" />
      </Button>

      {messages.length === 0 && (
        <div className="w-full mt-20 flex flex-col items-center justify-center">
          <TbChartBubbleFilled
            size={48}
            className="mb-1 text-accent-primary/60"
          />
          <h2 className="text-muted-foreground text-lg font-medium">
            Sphere Smart Wallet
          </h2>
          <p className="text-muted-foreground text-sm text-center">
            Perform actions on your wallet using natural language
          </p>

          <div className="w-full border-1 border-surface-subtle mt-3 px-2 rounded-[0.75rem]">
            {templateActions.map((_action, idx) => (
              <TemplateAction
                text={_action?.text}
                islast={idx == templateActions?.length - 1}
                onclick={(actiontext) => {
                  chat_form.setValue("userQuery", actiontext);
                  chat_input_ref.current?.focus();
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="w-full h-full pt-6 pb-20 overflow-y-auto space-y-4 flex flex-col">
        {messages?.map((msg, index) => (
          <div key={index} className="flex flex-col">
            {/* msg?.query -> user query/message */}
            <div className="flex flex-row items-start justify-end gap-1 mt-3">
              <div className="flex flex-col items-end">
                <span className="bg-secondary p-1 px-2 rounded-lg">
                  <ChatMessage text={msg.query} />
                </span>
                <span className="text-xs text-text-subtle text-right">
                  {dateDistance(msg.queryAt.toString())}
                </span>
              </div>

              {isTelegram ? (
                <Avatar className="p-[0.125rem] border-1 border-accent-primary">
                  <AvatarImage
                    className="rounded-full"
                    src={telegramUser?.photoUrl}
                    alt={telegramUser?.username}
                  />
                  <AvatarFallback>{telegramUser?.username}</AvatarFallback>
                </Avatar>
              ) : (
                <span className="bg-surface-subtle w-fit h-fit p-1 rounded-full">
                  <AiOutlineUser className="text-xl text-accent-primary" />
                </span>
              )}
            </div>

            {/* msg?.response -> agent response */}
            {msg?.response && (
              <div className="flex flex-row items-start gap-1 mt-3">
                <span className="bg-surface-subtle w-fit h-fit p-1 rounded-md">
                  <RiRobot3Fill className="text-xl text-accent-primary" />
                </span>

                <div className="flex flex-col items-start">
                  <span className="bg-secondary p-1 px-2 rounded-lg">
                    <ChatMessage text={msg.response} />
                  </span>
                  <span className="text-xs text-text-subtle text-right">
                    {dateDistance(msg.queryAt.toString())}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 flex items-center gap-[0.5rem] justify-between p-2 bg-surface border-t-1 border-border z-20">
        <Controller
          control={chat_form.control}
          name="userQuery"
          render={({ field }) => (
            <input
              {...field}
              ref={chat_input_ref}
              type="text"
              inputMode="text"
              placeholder="What would you like to do ?"
              className="bg-transparent border-none outline-none w-full h-full text-foreground placeholder:text-muted-foreground flex-1 text-[1rem]"
            />
          )}
        />

        <ActionButton
          variant="secondary"
          className="w-12 h-12 p-0 items-center justify-center gap-0 text-text-subtle"
          onClick={onSubmitQuery}
          disabled={agentChatMutation.isPending}
        >
          <IoArrowUpCircle className={cn("text-2xl text-text-default")} />
        </ActionButton>
      </div>
    </motion.div>
  );
}

interface message {
  query: string;
  response: string;
  queryAt: Date;
}

interface template_action {
  text: string;
}

const templateActions: template_action[] = [
  { text: "Send 100 USDC on Polygon to" },
  { text: "What's my total ETH balance" },
  { text: "Create a link to send 0.5 BERA to" },
  { text: "Swap 0.5 ETH for rETH on Arbitrum" },
];
