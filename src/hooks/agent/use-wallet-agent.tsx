import { useMutation } from "@tanstack/react-query";

interface chatargs {
  userquery: string;
}

async function chatWithAgent({ userquery }: chatargs) {
  const AUTH_TOKEN = localStorage.getItem("token");
  const API_KEY = import.meta.env.VITE_SDK_API_KEY;
  const AGENT_URL = import.meta.env.VITE_AGENT_URL;

  if (!AUTH_TOKEN || !API_KEY) {
    throw new Error("Missing API key or auth token");
  }

  const response = await fetch(AGENT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "x-auth-token": AUTH_TOKEN,
    },
    body: JSON.stringify({ query: userquery }),
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const res = await response.json();
  return res;
}

export const useWalletAgent = () => {
  const agentChatMutation = useMutation({
    mutationFn: chatWithAgent,
  });

  return { agentChatMutation };
};
