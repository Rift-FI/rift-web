import { useCallback, useEffect, useRef, useState } from "react";
import {
  resolveIriisEndpoint,
  resolveIriisResetEndpoint,
} from "./iriis-config";

export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  error?: boolean;
}

const GREETING: Message = {
  id: "iriis-hello",
  role: "assistant",
  content:
    "Hey, I'm Iriis, Rift's assistant. Ask me anything. Balances, orders, why a payment's slow, exchange rates, whatever's on your mind.",
  createdAt: Date.now(),
};

let seq = 0;
const nextId = () => `${Date.now()}-${++seq}`;

export function useIriisChat() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [sending, setSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    []
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      const userMsg: Message = {
        id: nextId(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      };
      setMessages((m) => [...m, userMsg]);
      setSending(true);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const { url, bearer, apiKey } = resolveIriisEndpoint();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (bearer) headers.Authorization = `Bearer ${bearer}`;
        if (apiKey) headers["x-api-key"] = apiKey;

        const res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({ message: trimmed }),
          signal: controller.signal,
        });

        if (res.status === 401 || res.status === 403) {
          setMessages((m) => [
            ...m,
            {
              id: nextId(),
              role: "assistant",
              content: bearer
                ? "Your session expired. Sign back into Rift and I'll pick up right where we left off."
                : "You need to be signed in to Rift so I know who I'm talking to. Sign in and come back — I'll be here.",
              createdAt: Date.now(),
              error: true,
            },
          ]);
          return;
        }
        if (res.status === 429) {
          setMessages((m) => [
            ...m,
            {
              id: nextId(),
              role: "assistant",
              content: "Whoa — you're going fast. Give me a minute to catch up.",
              createdAt: Date.now(),
              error: true,
            },
          ]);
          return;
        }
        if (!res.ok) {
          const detail = await safeErrorText(res);
          throw new Error(detail || `Iriis returned ${res.status}`);
        }
        const data = (await res.json()) as { reply?: string };
        const reply =
          data.reply?.trim() ||
          "I couldn't put an answer together for that. Mind rephrasing?";

        setMessages((m) => [
          ...m,
          {
            id: nextId(),
            role: "assistant",
            content: reply,
            createdAt: Date.now(),
          },
        ]);
      } catch (err) {
        if (controller.signal.aborted) return;
        setMessages((m) => [
          ...m,
          {
            id: nextId(),
            role: "assistant",
            content:
              "I couldn't reach my server just now. Try again in a moment — if it keeps happening, message support directly.",
            createdAt: Date.now(),
            error: true,
          },
        ]);
        // eslint-disable-next-line no-console
        console.warn("[iriis] chat request failed:", err);
      } finally {
        setSending(false);
      }
    },
    [sending]
  );

  const reset = useCallback(async () => {
    // Wipe UI first so it feels instant even if the network call is slow.
    setMessages([GREETING]);
    abortRef.current?.abort();
    try {
      const { url, bearer, apiKey } = resolveIriisResetEndpoint();
      const headers: Record<string, string> = {};
      if (bearer) headers.Authorization = `Bearer ${bearer}`;
      if (apiKey) headers["x-api-key"] = apiKey;
      await fetch(url, { method: "POST", headers });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[iriis] chat reset request failed:", err);
    }
  }, []);

  return { messages, sending, send, reset };
}

async function safeErrorText(res: Response): Promise<string> {
  try {
    const j = await res.json();
    if (typeof j?.detail === "string") return j.detail;
    if (typeof j?.error === "string") return j.error;
    return JSON.stringify(j);
  } catch {
    try {
      return await res.text();
    } catch {
      return "";
    }
  }
}
