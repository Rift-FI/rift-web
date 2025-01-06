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
  userAccessToken: string,
  chatAccessToken: string,
  prompt: string,
  conversationId: string,
  nonce: string
): Promise<{ message: string }> => {
  const URL = BASEURL + ENDPOINTS.promptgpt;

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
  userAccessToken: string,
  conversationId: string
): Promise<{ history: promptHistoryType[] }> => {
  const URL =
    BASEURL + ENDPOINTS.prompthistory + `?conversation_id=${conversationId}`;

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
