import { useCallback, useEffect, useRef, useState } from "react";
import { IRIIS_DEV_TOKEN, IRIIS_ENABLED, IRIIS_URL } from "./iriis-config";

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
    "Hey! I'm Iriis, Rift's assistant. Ask me anything — how to withdraw, why a payment's slow, exchange rates, whatever's on your mind.",
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

      if (!IRIIS_ENABLED) {
        setMessages((m) => [
          ...m,
          { id: nextId(), role: "user", content: trimmed, createdAt: Date.now() },
          {
            id: nextId(),
            role: "assistant",
            content:
              "I'm not wired up in this build yet — Iriis chat is a sandbox preview. Ping the team if you're seeing this in prod.",
            createdAt: Date.now(),
            error: true,
          },
        ]);
        return;
      }

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
        const res = await fetch(`${IRIIS_URL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${IRIIS_DEV_TOKEN}`,
          },
          body: JSON.stringify({ message: trimmed }),
          signal: controller.signal,
        });

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
              "I couldn't reach the Iriis service just now. Try again in a moment — if it keeps happening, message support directly.",
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

  const reset = useCallback(() => setMessages([GREETING]), []);

  return { messages, sending, send, reset, enabled: IRIIS_ENABLED };
}

async function safeErrorText(res: Response): Promise<string> {
  try {
    const j = await res.json();
    if (typeof j?.detail === "string") return j.detail;
    return JSON.stringify(j);
  } catch {
    try {
      return await res.text();
    } catch {
      return "";
    }
  }
}
