import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import IriisAvatar from "./iriis-avatar";
import { useIriisChat, type Message } from "./use-iriis-chat";

interface Props {
  open: boolean;
  onClose: () => void;
  /**
   * Where to anchor the panel. Mobile = full-width bottom sheet.
   * Desktop = 400px card anchored bottom-right, like Intercom.
   */
  variant: "mobile" | "desktop";
}

export default function IriisChatPanel({ open, onClose, variant }: Props) {
  const { messages, sending, send, reset } = useIriisChat();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, sending, open]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 240);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const submit = () => {
    if (!draft.trim() || sending) return;
    send(draft);
    setDraft("");
  };

  const isMobile = variant === "mobile";

  const panelClass = isMobile
    ? "absolute inset-x-0 bottom-0 z-50 flex h-[88%] flex-col rounded-t-[28px] border-t border-surface/60 bg-white shadow-[0_-24px_60px_-12px_rgba(15,42,56,0.24)]"
    : "fixed bottom-6 right-6 z-50 flex h-[640px] max-h-[calc(100vh-4rem)] w-[400px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-[24px] border border-surface/60 bg-white shadow-[0_32px_80px_-12px_rgba(15,42,56,0.28)]";

  const backdropClass = isMobile
    ? "absolute inset-0 z-40 bg-[#0F2A38]/45 backdrop-blur-[3px]"
    : "fixed inset-0 z-40 bg-[#0F2A38]/25 backdrop-blur-[2px]";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className={backdropClass}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            key="panel"
            className={panelClass}
            initial={
              isMobile
                ? { y: "100%" }
                : { y: 24, opacity: 0, scale: 0.98 }
            }
            animate={
              isMobile
                ? { y: 0 }
                : { y: 0, opacity: 1, scale: 1 }
            }
            exit={
              isMobile
                ? { y: "100%" }
                : { y: 24, opacity: 0, scale: 0.98 }
            }
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 34,
              mass: 0.7,
            }}
            role="dialog"
            aria-label="Chat with Iriis"
            aria-modal="true"
          >
            {isMobile && (
              <div className="mx-auto mt-3 mb-1 h-1.5 w-10 rounded-full bg-surface" />
            )}
            <Header onClose={onClose} onReset={reset} />
            <MessageList messages={messages} sending={sending} scrollRef={scrollRef} />
            <Composer
              value={draft}
              onChange={setDraft}
              onSubmit={submit}
              sending={sending}
              inputRef={inputRef}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Header({
  onClose,
  onReset,
}: {
  onClose: () => void;
  onReset: () => void;
}) {
  const handleReset = () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Delete this conversation with Iriis?")
    ) {
      return;
    }
    onReset();
  };

  return (
    <header className="flex items-center gap-3 border-b border-surface/70 px-5 py-4">
      <IriisAvatar size={40} />
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[17px] font-semibold leading-none tracking-[-0.01em] text-text-default">
          Iriis
        </h2>
        <p className="mt-1 text-[12.5px] leading-none text-text-subtle/70">
          CEO in training
        </p>
      </div>
      <button
        type="button"
        onClick={handleReset}
        aria-label="Delete this conversation"
        title="Delete conversation"
        className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full text-text-subtle/70 transition-colors hover:bg-surface hover:text-text-default"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path
            d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10M9 9v5M11 9v5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close Iriis chat"
        className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full text-text-subtle/70 transition-colors hover:bg-surface hover:text-text-default"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path
            d="M5 5l10 10M15 5L5 15"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </header>
  );
}

function MessageList({
  messages,
  sending,
  scrollRef,
}: {
  messages: Message[];
  sending: boolean;
  scrollRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div
      ref={scrollRef}
      className="flex-1 space-y-3 overflow-y-auto px-4 py-4 [-webkit-overflow-scrolling:touch]"
    >
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      {sending && <TypingIndicator />}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-[18px] rounded-br-md bg-accent-primary px-3.5 py-2.5 text-[14.5px] leading-[1.45] text-white shadow-[0_2px_8px_-2px_rgba(46,140,150,0.35)]">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-end gap-2">
      <IriisAvatar size={28} />
      <div
        className={`max-w-[80%] rounded-[18px] rounded-bl-md border px-3.5 py-2.5 text-[14.5px] leading-[1.45] text-text-default ${
          message.error
            ? "border-danger/30 bg-tint-danger/40"
            : "border-surface bg-white shadow-[0_1px_2px_rgba(15,42,56,0.04)]"
        }`}
      >
        {renderContent(message.content)}
      </div>
    </div>
  );
}

function renderContent(content: string) {
  return content.split("\n").map((line, i) => (
    <span key={i}>
      {line}
      {i < content.split("\n").length - 1 && <br />}
    </span>
  ));
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <IriisAvatar size={28} />
      <div className="rounded-[18px] rounded-bl-md border border-surface bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,42,56,0.04)]">
        <span className="flex items-center gap-1">
          {[0, 0.15, 0.3].map((delay, i) => (
            <span
              key={i}
              className="inline-block h-1.5 w-1.5 rounded-full bg-text-subtle/50"
              style={{
                animation: "iriis-dot 1.2s ease-in-out infinite",
                animationDelay: `${delay}s`,
              }}
            />
          ))}
        </span>
        <style>{`@keyframes iriis-dot { 0%,80%,100% { opacity: 0.3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }`}</style>
      </div>
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  sending,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  sending: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}) {
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value, inputRef]);

  return (
    <div className="border-t border-surface/70 bg-white px-3 py-3">
      <div className="flex items-end gap-2 rounded-[20px] border border-surface bg-surface/40 px-3 py-2 focus-within:border-accent-primary/50 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(46,140,150,0.12)]">
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          rows={1}
          placeholder="Message Iriis…"
          disabled={sending}
          className="max-h-[120px] min-h-[24px] flex-1 resize-none border-0 bg-transparent p-0 text-[14.5px] leading-[1.45] text-text-default placeholder:text-text-subtle/45 focus:outline-none disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={!value.trim() || sending}
          aria-label="Send message"
          className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full bg-accent-primary text-white shadow-[0_2px_6px_-1px_rgba(46,140,150,0.4)] transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:bg-text-subtle/25 disabled:shadow-none"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M8 13V3M8 3l-4 4M8 3l4 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <p className="mt-1.5 px-1 text-center text-[10.5px] text-text-subtle/50">
        Iriis is an AI assistant. Answers may be imperfect — don't share
        passwords or seed phrases.
      </p>
    </div>
  );
}
