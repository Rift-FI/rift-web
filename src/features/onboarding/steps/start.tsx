import { useEffect, type ComponentType } from "react";
import { useSearchParams } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, ChevronRight, Mail, Phone, User } from "lucide-react";
import { FiX } from "react-icons/fi";
import { useFlow } from "../context";
import { useDisclosure } from "@/hooks/use-disclosure";
import GoogleSignInButton from "@/components/auth/google-sign-in-button";
import AppleSignInButton from "@/components/auth/apple-sign-in-button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AUTH_METHODS } from "@/constants";
import useDesktopDetection from "@/hooks/use-desktop-detection";

/** Welcome palette (brand mockup): deep green, mint accent. */
const W = { bg: "#021619", glow: "#0E5F6E", arc: "#08414B", mint: "#8FE3EA", mintInk: "#03272C", sub: "#B2C7CA" };

type MethodKey = "phone" | "email" | "username-password";
const METHODS: {
  key: MethodKey;
  enabled: boolean;
  icon: ComponentType<{ className?: string }>;
  title: string;
  signup: string;
  login: string;
}[] = [
  { key: "phone", enabled: AUTH_METHODS.phone, icon: Phone, title: "Phone number", signup: "Quick verification with SMS", login: "Sign in with an SMS code" },
  { key: "email", enabled: AUTH_METHODS.email, icon: Mail, title: "Email address", signup: "Verification via email", login: "Sign in with an email code" },
  {
    key: "username-password",
    enabled: AUTH_METHODS.usernamePassword,
    icon: User,
    title: "Username & password",
    signup: "Classic login",
    login: "Sign in with your credentials",
  },
];

function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ background: W.bg }}>
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(120% 70% at 105% 0%, ${W.glow} 0%, rgba(2,22,25,0) 60%)` }}
      />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M105 6 C 55 22, 5 48, -10 95 L -10 100 L 110 100 Z" fill={W.arc} opacity="0.55" />
        <path d="M105 30 C 60 36, 20 55, 8 95" stroke="#127F8F" strokeOpacity="0.45" strokeWidth="0.15" fill="none" />
      </svg>
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(60% 40% at -5% 72%, rgba(18,129,149,0.45) 0%, rgba(2,22,25,0) 70%)" }}
      />
    </div>
  );
}

export default function Start() {
  const flow = useFlow();
  const [searchParams] = useSearchParams();
  const isDesktop = useDesktopDetection();
  const signup = useDisclosure();
  const login = useDisclosure();

  // Keep a referrer from the link for sign-up.
  useEffect(() => {
    const referrer = searchParams.get("referrer");
    if (referrer) localStorage.setItem("pending_referrer", referrer);
  }, [searchParams]);

  const choose = (mode: "signup" | "login", method: MethodKey) => {
    flow.stateControl.setValue("authMethod", method);
    if (mode === "signup") {
      signup.onClose();
      flow.goToNext();
      return;
    }
    login.onClose();
    flow.goToNext(method === "phone" ? "login-phone" : method === "email" ? "login-email" : "login-username-password");
  };

  const sheet = (mode: "signup" | "login") => {
    const d = mode === "signup" ? signup : login;
    const social = AUTH_METHODS.google || AUTH_METHODS.apple;
    return (
      <Drawer open={d.isOpen} onClose={d.onClose} onOpenChange={(open) => (open ? d.onOpen() : d.onClose())}>
        <DrawerContent className={isDesktop ? "max-w-md bg-card overflow-hidden" : "bg-card"}>
          <DrawerHeader className={`${isDesktop ? "p-6 pb-4" : "p-5 pb-3"} relative text-left`}>
            {isDesktop && (
              <button
                onClick={d.onClose}
                aria-label="Close"
                className="absolute top-5 right-5 p-2 hover:bg-surface-subtle rounded-full transition-colors"
              >
                <FiX className="w-5 h-5 text-text-muted" aria-hidden="true" />
              </button>
            )}
            <DrawerTitle className="text-[22px] font-semibold tracking-[-0.01em]">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </DrawerTitle>
            <DrawerDescription className="text-[14px] mt-1 text-text-muted">
              {mode === "signup" ? "Choose how you'd like to sign up" : "Sign in to your Rift account"}
            </DrawerDescription>
          </DrawerHeader>

          <div className={`w-full flex flex-col ${isDesktop ? "pb-6 px-6" : "pb-6 px-5"} gap-2.5`}>
            {social && (
              <>
                {AUTH_METHODS.google && (
                  <div className="w-full flex justify-center">
                    <GoogleSignInButton text="continue_with" />
                  </div>
                )}
                {AUTH_METHODS.apple && (
                  <div className="w-full flex justify-center">
                    <AppleSignInButton />
                  </div>
                )}
                <div className="flex items-center gap-3 text-text-muted text-xs my-1">
                  <div className="flex-1 h-px bg-border" />
                  <span>or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              </>
            )}

            {METHODS.map((m) => (
              <motion.button
                key={m.key}
                type="button"
                whileTap={m.enabled ? { scale: 0.99 } : undefined}
                disabled={!m.enabled}
                onClick={() => m.enabled && choose(mode, m.key)}
                className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl text-left transition-colors ${
                  m.enabled ? "bg-surface-subtle hover:bg-surface cursor-pointer" : "bg-surface-subtle opacity-60 cursor-not-allowed"
                }`}
              >
                <span className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-accent-primary/10">
                  <m.icon className={`w-[18px] h-[18px] ${m.enabled ? "text-accent-primary" : "text-ink-3"}`} />
                </span>
                <span className="flex flex-col flex-1 min-w-0">
                  <span className={`text-[15px] font-semibold ${m.enabled ? "text-ink" : "text-ink-3"}`}>{m.title}</span>
                  <span className="text-[13px] text-ink-3">
                    {m.enabled ? (mode === "signup" ? m.signup : m.login) : "Under maintenance"}
                  </span>
                </span>
                {m.enabled ? (
                  <ChevronRight className="w-[18px] h-[18px] text-ink-3" aria-hidden="true" />
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] border border-warning/35 bg-tint-pending text-pending rounded-sm">
                    Maintenance
                  </span>
                )}
              </motion.button>
            ))}

            {mode === "login" && (
              <button
                onClick={() => {
                  login.onClose();
                  flow.goToNext("account-recovery-start");
                }}
                className="w-full text-center pt-2 text-[13px] text-text-subtle hover:text-accent-primary transition-colors"
              >
                Lost access to your phone or email? <span className="text-accent-primary font-medium">Recover account</span>
              </button>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    );
  };

  const ctas = (
    <div className={`w-full ${isDesktop ? "max-w-[420px]" : ""} flex flex-col gap-1.5`}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.985 }}
        onClick={signup.onOpen}
        className="relative w-full h-[60px] rounded-full font-semibold text-[18px] transition-[filter] hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ background: W.mint, color: W.mintInk, outlineColor: W.mint }}
      >
        Get started
        <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 w-[22px] h-[22px]" aria-hidden="true" />
      </motion.button>
      <button
        type="button"
        onClick={login.onOpen}
        className="w-full h-[52px] text-[17px] font-medium text-white/95 hover:text-white transition-colors"
      >
        Sign in
      </button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative w-full h-full overflow-hidden text-white"
      style={{ background: W.bg, paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <Backdrop />

      {isDesktop ? (
        <div className="relative z-10 h-full max-w-6xl mx-auto px-12 grid grid-cols-[1fr_1fr] items-center gap-10">
          <div className="flex flex-col gap-10">
            <span className="flex items-center gap-2.5" aria-label="Rift">
              <img src="/rift-mark.png" alt="" className="w-[38px] h-[38px]" />
              <span className="text-[34px] font-semibold tracking-[-0.03em] leading-none">rift</span>
            </span>
            <div>
              <h1 className="text-[68px] leading-[1.02] font-medium tracking-[-0.035em]">
                Move money
                <br />
                across <span style={{ color: W.mint }}>borders.</span>
              </h1>
              <p className="mt-6 text-[19px] leading-[1.45]" style={{ color: W.sub }}>
                Send, receive and manage
                <br />
                money across Africa.
              </p>
            </div>
            {ctas}
          </div>
          <div className="relative h-full flex items-center justify-center">
            <img
              src="/welcome-hero.webp"
              alt=""
              className="w-full max-w-[680px] object-contain select-none"
              style={{
                // Blend the photo's own backdrop into the page on every side.
                WebkitMaskImage: "radial-gradient(ellipse 50% 50% at 50% 50%, #000 62%, transparent 100%)",
                maskImage: "radial-gradient(ellipse 50% 50% at 50% 50%, #000 62%, transparent 100%)",
              }}
              draggable={false}
            />
          </div>
        </div>
      ) : (
        <div className="relative z-10 h-full flex flex-col">
          <div className="px-7 pt-8 flex flex-col gap-8">
            <span className="flex items-center gap-2.5" aria-label="Rift">
              <img src="/rift-mark.png" alt="" className="w-[38px] h-[38px]" />
              <span className="text-[34px] font-semibold tracking-[-0.03em] leading-none">rift</span>
            </span>
            <div>
              <h1 className="text-[44px] leading-[1.09] font-medium tracking-[-0.03em]">
                Move money
                <br />
                across <span style={{ color: W.mint }}>borders.</span>
              </h1>
              <p className="mt-4 text-[17px] leading-[1.4]" style={{ color: W.sub }}>
                Send, receive and manage
                <br />
                money across Africa.
              </p>
            </div>
          </div>
          <div className="relative flex-1 min-h-0 flex items-end justify-center">
            <img
              src="/welcome-hero.webp"
              alt=""
              className="w-[108%] max-w-[560px] max-h-full object-contain object-bottom -mb-[72px] select-none"
              draggable={false}
            />
          </div>
          <div className="relative px-7 pb-4">{ctas}</div>
        </div>
      )}

      {sheet("signup")}
      {sheet("login")}
    </motion.div>
  );
}
