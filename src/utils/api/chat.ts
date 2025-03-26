import { BASEURL, ENDPOINTS } from "./config";

export type messagesType = {
  role: "user" | "assistant";
  content: string;
};

export type promptHistoryType = {
  prompt: string;
  response: string;
};

export const UseGptPrompt = async (
  chatAccessToken: string,
  prompt: string,
  conversationId: string,
  nonce: string
): Promise<{ message: string }> => {
  const URL = BASEURL + ENDPOINTS.promptgpt;
  let userAccessToken: string | null = localStorage.getItem("spheretoken");

  let res: Response = await fetch(URL, {
    method: "POST",
    body: JSON.stringify({
      accessToken: chatAccessToken,
      user_prompt: prompt,
      conversation_id: conversationId,
      nonce,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userAccessToken}`,
    },
  });

  const data = await res.json();

  return { message: data?.message };
};

export const GetPromptHistory = async (
  conversationId: string
): Promise<{ history: promptHistoryType[] }> => {
  const URL =
    BASEURL + ENDPOINTS.prompthistory + `?conversation_id=${conversationId}`;
  let userAccessToken: string | null = localStorage.getItem("spheretoken");

  let res: Response = await fetch(URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userAccessToken}`,
    },
  });

  const data: promptHistoryType[] = await res.json();

  return { history: data };
};

// chat with bot -> using my own key
export const ChatWithBotFromKey = async (
  secret: string,
  prompt: string
): Promise<{ response: string }> => {
  const URL = BASEURL + ENDPOINTS.chatwithbot;
  const authToken = localStorage.getItem("spheretoken");

  const res: Response = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ secret, prompt }),
  });

  const data = await res.json();
  return data;
};

// chat with bot -> using my own key
export const ChatWithBotFromKeyHistory = async (
  secret: string
): Promise<{ history: promptHistoryType[] }> => {
  const URL = BASEURL + ENDPOINTS.chatbothistory;
  const authToken = localStorage.getItem("spheretoken");

  const res: Response = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ secret }),
  });

  const responsedata = await res.json();
  const data: promptHistoryType[] = responsedata?.history;

  return { history: data };
};
