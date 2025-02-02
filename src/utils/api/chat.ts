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

export const UseAIHelperPrompt = async (
  accessToken: string, 
  command: string
): Promise<{ message: string; link?: string }> => {
  // Predefined helper commands
  const helperCommands: { [key: string]: { description: string; link: string } } = {
    "/start": {
      description: "Welcome to StratoSphere ID! I'm your AI assistant to help you navigate our features.",
      link: "/app"
    },
    "/get_om": {
      description: "Get OM token: Buy OM using Eth, USD, or HKD. Navigate to the 'Get OM' section to purchase.",
      link: "/get-om"
    },
    "/send_btc": {
      description: "Send Bitcoin: Easily send Bitcoin directly to another address from your wallet.",
      link: "/send-btc"
    },
    "/send_eth": {
      description: "Send ETH: Send Ethereum directly to an address or via Telegram with ease.",
      link: "/eth-asset"
    },
    "/lend_earn": {
      description: "Lend & Earn: Allow others to use your crypto assets and secrets while earning rewards.",
      link: "/lend"
    },
    "/security": {
      description: "Security Setup: Configure and manage the security settings for your StratoSphere ID wallet.",
      link: "/security/setup"
    },
    "/rewards": {
      description: "Rewards Program: Check and manage your rewards, including locked and unlocked amounts.",
      link: "/rewards"
    },
    "/referral": {
      description: "Referral Program: Share your unique referral link and earn rewards by inviting friends.",
      link: "/referral"
    }
  };

  // Check if the command exists
  const helperResponse = helperCommands[command.toLowerCase()];
  
  if (helperResponse) {
    return {
      message: helperResponse.description,
      link: helperResponse.link
    };
  }

  // Fallback for unknown commands
  return {
    message: "I'm sorry, I didn't recognize that command. Try /start for a list of available commands.",
    link: "/app"
  };
}
