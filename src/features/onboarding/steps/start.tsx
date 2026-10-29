import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { motion } from "motion/react";
import { HiPhone } from "react-icons/hi";
import { HiOutlineMail } from "react-icons/hi";
import { User, DollarSign, CreditCard, Send, TrendingUp, Shield, ArrowUpRight } from "lucide-react";
import { FiX } from "react-icons/fi";
import { useFlow } from "../context";
import { useDisclosure } from "@/hooks/use-disclosure";
import ActionButton from "@/components/ui/action-button";
import GoogleSignInButton from "@/components/auth/google-sign-in-button";
import AppleSignInButton from "@/components/auth/apple-sign-in-button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import riftlogo from "@/assets/rift.png";
import { AUTH_METHODS } from "@/constants";
import useDesktopDetection from "@/hooks/use-desktop-detection";

const DISPLAY_FONT = 'var(--app-font-display)';

export default function Start() {
  const flow = useFlow();
  const [searchParams] = useSearchParams();
  const isDesktop = useDesktopDetection();

  const {
    isOpen: isSignupOpen,
    onOpen: onSignupOpen,
    onClose: onSignupClose,
  } = useDisclosure();
  const {
    isOpen: isLoginOpen,
    onOpen: onLoginOpen,
    onClose: onLoginClose,
  } = useDisclosure();

  // Extract referrer from URL params and store it for signup
  useEffect(() => {
    const referrer = searchParams.get("referrer");
    if (referrer) {
      localStorage.setItem("pending_referrer", referrer);
    }
  }, [searchParams]);

  const handleSignupWithMethod = (
    method: "phone" | "email" | "username-password"
  ) => {
    flow.stateControl.setValue("authMethod", method);
    onSignupClose();
    flow.goToNext();
  };

  const handleLoginWithMethod = (
    method: "phone" | "email" | "username-password"
  ) => {
    flow.stateControl.setValue("authMethod", method);
    onLoginClose();

    const loginStep =
      method === "phone"
        ? "login-phone"
        : method === "email"
        ? "login-email"
        : "login-username-password";
    flow.goToNext(loginStep);
  };

  const features = [
    {
      icon: DollarSign,
      title: "Hold USD balances",
      description: "Keep working capital in dollars between payment runs",
      delay: 0.2,
    },
    {
      icon: CreditCard,
      title: "Local payouts",
      description: "Pay suppliers and staff to mobile money or bank accounts",
      delay: 0.3,
    },
    {
      icon: Send,
      title: "Cross-border payments",
      description: "Local currency in, local currency out, across African corridors",
      delay: 0.4,
    },
    {
      icon: TrendingUp,
      title: "Treasury yield",
      description: "Optional dollar-denominated yield on idle balances",
      delay: 0.5,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="w-full h-full flex flex-col relative overflow-hidden bg-app-background"
    >
      {/* Brand header — fixed at top */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={`relative z-20 flex items-center justify-between border-b border-border bg-white ${isDesktop ? "px-10 h-16" : "px-5 h-14"}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative flex-shrink-0">
            <img
              alt="Rift"
              src={riftlogo}
              className={`relative z-10 ${isDesktop ? "w-7 h-7" : "w-6 h-6"}`}
            />
          </div>
          <span
            className={`font-semibold text-text-default tracking-[-0.01em] ${isDesktop ? "text-[18px]" : "text-[17px]"}`}
            style={{ fontFamily: DISPLAY_FONT }}
          >
            Rift
          </span>
        </div>
      </motion.header>

      {/* Main Content Container */}
      <div
        className={`flex-1 flex flex-col min-h-0 overflow-y-auto relative z-10 ${
          isDesktop ? "px-10 pb-10" : "px-5 pb-4"
        }`}
      >
        {/* Hero Section */}
        <div
          className={`flex-1 ${
            isDesktop
              ? "grid grid-cols-[1.1fr_1fr] gap-16 items-center max-w-6xl mx-auto w-full pt-4"
              : "flex flex-col items-center justify-start pt-6"
          }`}
        >
          {/* Left column: copy + CTAs */}
          <div className={isDesktop ? "min-w-0" : "w-full"}>
            {/* Headline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={isDesktop ? "text-left" : "text-left"}
            >
              <h1
                className={`text-text-default leading-[1.08] tracking-[-0.025em] font-semibold ${
                  isDesktop ? "text-[52px]" : "text-[32px]"
                }`}
                style={{ fontFamily: DISPLAY_FONT }}
              >
                Pay across African borders in minutes.
              </h1>
              <h2
                className={`leading-[1.15] tracking-[-0.02em] font-semibold text-accent-primary ${
                  isDesktop ? "text-[28px] mt-3 mb-5" : "text-[20px] mt-2 mb-4"
                }`}
                style={{ fontFamily: DISPLAY_FONT }}
              >
                Local currency in, local currency out.
              </h2>
              <p
                className={`text-text-muted leading-relaxed ${
                  isDesktop ? "text-[16px] max-w-[500px] mb-8" : "text-[15px] mb-6"
                }`}
              >
                Collections, payouts and dollar balances for businesses and the finance
                teams behind them, on rails your bank will sign off.
              </p>
            </motion.div>

            {/* CTA — signup drawer trigger (primary) */}
            <motion.div
              className={`${isDesktop ? "w-full max-w-[440px]" : "w-full"} space-y-3`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {(AUTH_METHODS.google || AUTH_METHODS.apple) && (
                <div className="w-full flex flex-col items-stretch gap-3">
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
                  <div className="flex items-center gap-3 text-text-muted text-xs">
                    <div className="flex-1 h-px bg-border" />
                    <span>or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                </div>
              )}

              <Drawer
                open={isSignupOpen}
                onClose={onSignupClose}
                onOpenChange={(open) => {
                  if (open) onSignupOpen();
                  else onSignupClose();
                }}
              >
                <DrawerTrigger asChild>
                  <motion.div
                    whileTap={{ scale: 0.99 }}
                    className="w-full"
                  >
                    <ActionButton
                      variant="secondary"
                      className={`!h-auto ${isDesktop ? "py-3.5 text-[15px]" : "py-3 text-[15px]"} font-semibold bg-accent-primary hover:bg-accent-secondary transition-colors rounded-md`}
                    >
                      <span className="flex items-center gap-2">
                        Open an account
                        <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                      </span>
                    </ActionButton>
                  </motion.div>
                </DrawerTrigger>

                <DrawerContent className={isDesktop ? "max-w-md bg-white overflow-hidden" : "bg-white"}>
                  <DrawerHeader className={`${isDesktop ? "p-6 pb-4" : "p-4"} relative`}>
                    {isDesktop && (
                      <button
                        onClick={onSignupClose}
                        className="absolute top-5 right-5 p-2 hover:bg-surface-subtle rounded-md transition-colors"
                      >
                        <FiX className="w-5 h-5 text-text-muted" aria-hidden="true" />
                      </button>
                    )}
                    <DrawerTitle className={isDesktop ? "text-[20px] font-semibold" : ""}>Create your account</DrawerTitle>
                    <DrawerDescription className={isDesktop ? "text-[14px] mt-1 text-text-muted" : ""}>
                      Start moving between stablecoins and local currency
                    </DrawerDescription>
                  </DrawerHeader>

                  <div className={`w-full flex flex-col ${isDesktop ? "pb-6 px-6" : "pb-4 px-4"} space-y-3`}>
                    {/* Phone Number */}
                    <motion.div
                      whileTap={AUTH_METHODS.phone ? { scale: 0.99 } : undefined}
                      onClick={() => AUTH_METHODS.phone && handleSignupWithMethod("phone")}
                      className={`w-full flex flex-row items-center gap-4 ${isDesktop ? "p-4" : "p-3.5"} rounded-md border transition-colors ${
                        AUTH_METHODS.phone
                          ? "cursor-pointer bg-white hover:bg-surface-subtle border-border hover:border-text-default/25"
                          : "cursor-not-allowed bg-surface-subtle opacity-60 border-border"
                      }`}
                    >
                      <div className={`${isDesktop ? "w-10 h-10" : "w-9 h-9"} rounded-md flex items-center justify-center flex-shrink-0 ${AUTH_METHODS.phone ? "bg-accent-primary/10" : "bg-gray-200"}`}>
                        <HiPhone className={`${isDesktop ? "w-6 h-6" : "text-lg"} ${AUTH_METHODS.phone ? "text-accent-primary" : "text-gray-400"}`} />
                      </div>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <p className={`${isDesktop ? "text-base" : "text-sm"} font-semibold ${AUTH_METHODS.phone ? "text-gray-900" : "text-gray-500"}`}>Phone Number</p>
                        <p className={`${isDesktop ? "text-sm" : "text-xs"} text-gray-500 mt-0.5`}>{AUTH_METHODS.phone ? "Quick verification with SMS" : "Under maintenance"}</p>
                      </div>
                      {!AUTH_METHODS.phone && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] border border-[#ecd9a8] bg-[#fbf6ea] text-[#7a5a12] rounded-sm whitespace-nowrap flex-shrink-0">Maintenance</span>
                      )}
                    </motion.div>

                    {/* Email Address */}
                    <motion.div
                      whileTap={AUTH_METHODS.email ? { scale: 0.99 } : undefined}
                      onClick={() => AUTH_METHODS.email && handleSignupWithMethod("email")}
                      className={`w-full flex flex-row items-center gap-4 ${isDesktop ? "p-4" : "p-3.5"} rounded-md border transition-colors ${
                        AUTH_METHODS.email
                          ? "cursor-pointer bg-white hover:bg-surface-subtle border-border hover:border-text-default/25"
                          : "cursor-not-allowed bg-surface-subtle opacity-60 border-border"
                      }`}
                    >
                      <div className={`${isDesktop ? "w-10 h-10" : "w-9 h-9"} rounded-md flex items-center justify-center flex-shrink-0 ${AUTH_METHODS.email ? "bg-accent-primary/10" : "bg-gray-200"}`}>
                        <HiOutlineMail className={`${isDesktop ? "w-6 h-6" : "text-lg"} ${AUTH_METHODS.email ? "text-accent-primary" : "text-gray-400"}`} />
                      </div>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <p className={`${isDesktop ? "text-base" : "text-sm"} font-semibold ${AUTH_METHODS.email ? "text-gray-900" : "text-gray-500"}`}>Email Address</p>
                        <p className={`${isDesktop ? "text-sm" : "text-xs"} text-gray-500 mt-0.5`}>{AUTH_METHODS.email ? "Verification via email" : "Under maintenance"}</p>
                      </div>
                      {!AUTH_METHODS.email && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] border border-[#ecd9a8] bg-[#fbf6ea] text-[#7a5a12] rounded-sm whitespace-nowrap flex-shrink-0">Maintenance</span>
                      )}
                    </motion.div>

                    {/* Username & Password */}
                    <motion.div
                      whileTap={AUTH_METHODS.usernamePassword ? { scale: 0.99 } : undefined}
                      onClick={() => AUTH_METHODS.usernamePassword && handleSignupWithMethod("username-password")}
                      className={`w-full flex flex-row items-center gap-4 ${isDesktop ? "p-4" : "p-3.5"} rounded-md border transition-colors ${
                        AUTH_METHODS.usernamePassword
                          ? "cursor-pointer bg-white hover:bg-surface-subtle border-border hover:border-text-default/25"
                          : "cursor-not-allowed bg-surface-subtle opacity-60 border-border"
                      }`}
                    >
                      <div className={`${isDesktop ? "w-10 h-10" : "w-9 h-9"} rounded-md flex items-center justify-center flex-shrink-0 ${AUTH_METHODS.usernamePassword ? "bg-accent-primary/10" : "bg-gray-200"}`}>
                        <User className={`${isDesktop ? "w-6 h-6" : "w-5 h-5"} ${AUTH_METHODS.usernamePassword ? "text-accent-primary" : "text-gray-400"}`} />
                      </div>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <p className={`${isDesktop ? "text-base" : "text-sm"} font-semibold ${AUTH_METHODS.usernamePassword ? "text-gray-900" : "text-gray-500"}`}>Username & Password</p>
                        <p className={`${isDesktop ? "text-sm" : "text-xs"} text-gray-500 mt-0.5`}>{AUTH_METHODS.usernamePassword ? "Traditional login method" : "Under maintenance"}</p>
                      </div>
                      {!AUTH_METHODS.usernamePassword && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] border border-[#ecd9a8] bg-[#fbf6ea] text-[#7a5a12] rounded-sm whitespace-nowrap flex-shrink-0">Maintenance</span>
                      )}
                    </motion.div>
                  </div>
                </DrawerContent>
              </Drawer>

              <Drawer
                open={isLoginOpen}
                onClose={onLoginClose}
                onOpenChange={(open) => {
                  if (open) onLoginOpen();
                  else onLoginClose();
                }}
              >
                <DrawerTrigger asChild>
                  <motion.button
                    whileTap={{ scale: 0.99 }}
                    className={`w-full ${isDesktop ? "py-3.5 text-[14px]" : "py-3 text-[14px]"} font-medium text-text-subtle hover:text-accent-primary transition-colors`}
                  >
                    Already have an account?{" "}
                    <span className="text-accent-primary font-semibold">Sign in</span>
                  </motion.button>
                </DrawerTrigger>
                <DrawerContent className={isDesktop ? "max-w-md bg-white overflow-hidden" : "bg-white"}>
                  <DrawerHeader className={`${isDesktop ? "p-6 pb-4" : "p-4"} relative`}>
                    {isDesktop && (
                      <button
                        onClick={onLoginClose}
                        className="absolute top-5 right-5 p-2 hover:bg-surface-subtle rounded-md transition-colors"
                      >
                        <FiX className="w-5 h-5 text-text-muted" aria-hidden="true" />
                      </button>
                    )}
                    <DrawerTitle className={isDesktop ? "text-[20px] font-semibold" : ""}>Sign in</DrawerTitle>
                    <DrawerDescription className={isDesktop ? "text-[14px] mt-1 text-text-muted" : ""}>Sign in to access your Rift account</DrawerDescription>
                  </DrawerHeader>

                  <div className={`w-full flex flex-col ${isDesktop ? "pb-6 px-6" : "pb-4 px-4"} space-y-3`}>
                    {/* Phone Number */}
                    <motion.div
                      whileTap={AUTH_METHODS.phone ? { scale: 0.99 } : undefined}
                      onClick={() => AUTH_METHODS.phone && handleLoginWithMethod("phone")}
                      className={`w-full flex flex-row items-center gap-4 ${isDesktop ? "p-4" : "p-3.5"} rounded-md border transition-colors ${
                        AUTH_METHODS.phone
                          ? "cursor-pointer bg-white hover:bg-surface-subtle border-border hover:border-text-default/25"
                          : "cursor-not-allowed bg-surface-subtle opacity-60 border-border"
                      }`}
                    >
                      <div className={`${isDesktop ? "w-10 h-10" : "w-9 h-9"} rounded-md flex items-center justify-center flex-shrink-0 ${AUTH_METHODS.phone ? "bg-accent-primary/10" : "bg-gray-200"}`}>
                        <HiPhone className={`${isDesktop ? "w-6 h-6" : "text-lg"} ${AUTH_METHODS.phone ? "text-accent-primary" : "text-gray-400"}`} />
                      </div>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <p className={`${isDesktop ? "text-base" : "text-sm"} font-semibold ${AUTH_METHODS.phone ? "text-gray-900" : "text-gray-500"}`}>Phone Number</p>
                        <p className={`${isDesktop ? "text-sm" : "text-xs"} text-gray-500 mt-0.5`}>{AUTH_METHODS.phone ? "Login with SMS code" : "Under maintenance"}</p>
                      </div>
                      {!AUTH_METHODS.phone && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] border border-[#ecd9a8] bg-[#fbf6ea] text-[#7a5a12] rounded-sm whitespace-nowrap flex-shrink-0">Maintenance</span>
                      )}
                    </motion.div>

                    {/* Email Address */}
                    <motion.div
                      whileTap={AUTH_METHODS.email ? { scale: 0.99 } : undefined}
                      onClick={() => AUTH_METHODS.email && handleLoginWithMethod("email")}
                      className={`w-full flex flex-row items-center gap-4 ${isDesktop ? "p-4" : "p-3.5"} rounded-md border transition-colors ${
                        AUTH_METHODS.email
                          ? "cursor-pointer bg-white hover:bg-surface-subtle border-border hover:border-text-default/25"
                          : "cursor-not-allowed bg-surface-subtle opacity-60 border-border"
                      }`}
                    >
                      <div className={`${isDesktop ? "w-10 h-10" : "w-9 h-9"} rounded-md flex items-center justify-center flex-shrink-0 ${AUTH_METHODS.email ? "bg-accent-primary/10" : "bg-gray-200"}`}>
                        <HiOutlineMail className={`${isDesktop ? "w-6 h-6" : "text-lg"} ${AUTH_METHODS.email ? "text-accent-primary" : "text-gray-400"}`} />
                      </div>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <p className={`${isDesktop ? "text-base" : "text-sm"} font-semibold ${AUTH_METHODS.email ? "text-gray-900" : "text-gray-500"}`}>Email Address</p>
                        <p className={`${isDesktop ? "text-sm" : "text-xs"} text-gray-500 mt-0.5`}>{AUTH_METHODS.email ? "Login with email code" : "Under maintenance"}</p>
                      </div>
                      {!AUTH_METHODS.email && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] border border-[#ecd9a8] bg-[#fbf6ea] text-[#7a5a12] rounded-sm whitespace-nowrap flex-shrink-0">Maintenance</span>
                      )}
                    </motion.div>

                    {/* Username & Password */}
                    <motion.div
                      whileTap={AUTH_METHODS.usernamePassword ? { scale: 0.99 } : undefined}
                      onClick={() => AUTH_METHODS.usernamePassword && handleLoginWithMethod("username-password")}
                      className={`w-full flex flex-row items-center gap-4 ${isDesktop ? "p-4" : "p-3.5"} rounded-md border transition-colors ${
                        AUTH_METHODS.usernamePassword
                          ? "cursor-pointer bg-white hover:bg-surface-subtle border-border hover:border-text-default/25"
                          : "cursor-not-allowed bg-surface-subtle opacity-60 border-border"
                      }`}
                    >
                      <div className={`${isDesktop ? "w-10 h-10" : "w-9 h-9"} rounded-md flex items-center justify-center flex-shrink-0 ${AUTH_METHODS.usernamePassword ? "bg-accent-primary/10" : "bg-gray-200"}`}>
                        <User className={`${isDesktop ? "w-6 h-6" : "w-5 h-5"} ${AUTH_METHODS.usernamePassword ? "text-accent-primary" : "text-gray-400"}`} />
                      </div>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <p className={`${isDesktop ? "text-base" : "text-sm"} font-semibold ${AUTH_METHODS.usernamePassword ? "text-gray-900" : "text-gray-500"}`}>Username & Password</p>
                        <p className={`${isDesktop ? "text-sm" : "text-xs"} text-gray-500 mt-0.5`}>{AUTH_METHODS.usernamePassword ? "Login with credentials" : "Under maintenance"}</p>
                      </div>
                      {!AUTH_METHODS.usernamePassword && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] border border-[#ecd9a8] bg-[#fbf6ea] text-[#7a5a12] rounded-sm whitespace-nowrap flex-shrink-0">Maintenance</span>
                      )}
                    </motion.div>

                    {/* Lost access link */}
                    <button
                      onClick={() => {
                        onLoginClose();
                        flow.goToNext("account-recovery-start");
                      }}
                      className="w-full text-center py-2 text-xs text-text-subtle hover:text-accent-primary transition-colors"
                    >
                      Lost access to your phone or email?{" "}
                      <span className="text-accent-primary font-medium">Recover account</span>
                    </button>
                  </div>
                </DrawerContent>
              </Drawer>
            </motion.div>

            {/* Trust row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-text-muted ${isDesktop ? "mt-7" : "mt-5"}`}
            >
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-accent-primary" aria-hidden="true" />
                <span className="font-medium">Bank-grade security</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-text-muted/40" aria-hidden="true" />
              <span>Fast settlement</span>
              <div className="w-1 h-1 rounded-full bg-text-muted/40" aria-hidden="true" />
              <span>Transparent pricing</span>
            </motion.div>
          </div>

          {/* Right column: illustrative statement panel — desktop only */}
          {isDesktop && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="relative flex items-center justify-center"
              aria-hidden="true"
            >
              <div className="relative w-full max-w-[460px] rounded-lg border border-border bg-white shadow-lg overflow-hidden">
                <div className="flex items-center justify-between px-5 h-12 border-b border-border">
                  <div className="flex items-center gap-2">
                    <img src={riftlogo} alt="" className="w-5 h-5" />
                    <span className="font-semibold text-[13px] text-text-default" style={{ fontFamily: DISPLAY_FONT }}>
                      Account overview
                    </span>
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.08em] text-text-muted font-medium">
                    Multi-currency
                  </span>
                </div>

                <div className="px-5 py-5 border-b border-border">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-text-muted font-medium mb-2">
                    Available balance
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[34px] font-semibold leading-none tracking-[-0.02em] text-text-default tabular-numeric" style={{ fontFamily: DISPLAY_FONT }}>
                      4,218.92
                    </span>
                    <span className="text-[14px] font-medium text-text-muted">USD</span>
                  </div>
                  <p className="mt-2 text-[12px] text-text-muted tabular-numeric">
                    545,221.48 KES equivalent
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {["USD", "KES", "NGN", "UGX", "TZS", "BRL"].map((code) => (
                      <span
                        key={code}
                        className="inline-flex items-center px-1.5 py-0.5 rounded-sm border border-border text-[11px] font-semibold tracking-[0.04em] text-text-default"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-5 py-2 bg-surface-subtle border-b border-border text-[11px] uppercase tracking-[0.06em] font-semibold text-text-muted">
                    <span>Recent activity</span>
                    <span className="text-right">Amount</span>
                    <span className="text-right w-16">Status</span>
                  </div>
                  {[
                    { label: "Collection · M-Pesa", amount: "+500.00 USD", status: "Received" },
                    { label: "Payout · Lagos", amount: "−120.00 USD", status: "Settled" },
                    { label: "Payout · Kampala", amount: "−860.00 USD", status: "Settled" },
                  ].map((tx) => (
                    <div
                      key={tx.label}
                      className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center px-5 h-11 border-b border-border last:border-b-0"
                    >
                      <span className="text-[13px] text-text-default">{tx.label}</span>
                      <span className="text-[13px] font-semibold text-text-default text-right tabular-numeric">
                        {tx.amount}
                      </span>
                      <span className="w-16 text-right text-[11px] font-medium text-success">{tx.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Mobile-only: feature chips grid under CTAs */}
          {!isDesktop && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="mt-6 grid grid-cols-2 gap-px bg-border border border-border rounded-lg overflow-hidden w-full"
            >
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex flex-col items-start gap-2 p-3.5 bg-white"
                >
                  <div className="w-8 h-8 rounded-md border border-border bg-surface-subtle flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-accent-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-text-default leading-tight">{feature.title}</p>
                    <p className="text-[11.5px] text-text-muted leading-snug mt-0.5">{feature.description}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
