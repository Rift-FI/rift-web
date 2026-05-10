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

const DISPLAY_FONT = '"Clash Display", "Satoshi", ui-sans-serif, system-ui, sans-serif';
const MONO_FONT = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

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
      title: "Buy & Hold USDC",
      description: "Keep your money in dollars — protected from local currency swings",
      delay: 0.2,
    },
    {
      icon: CreditCard,
      title: "Spend Locally",
      description: "Use your USDC for everyday payments, bills, and purchases",
      delay: 0.3,
    },
    {
      icon: Send,
      title: "Send Across Borders",
      description: "Transfer money globally — faster and cheaper than traditional rails",
      delay: 0.4,
    },
    {
      icon: TrendingUp,
      title: "Grow Your Money",
      description: "Invest in dollar-denominated financial products and save smarter",
      delay: 0.5,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full flex flex-col relative overflow-hidden bg-app-background"
    >
      {/* Ambient background — subtle blurred gradient orbs + faint grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Teal orb top-right */}
        <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-accent-primary/25 blur-[120px] opacity-60" />
        {/* Soft warm orb bottom-left */}
        <div className="absolute -bottom-40 -left-40 w-[560px] h-[560px] rounded-full bg-[#F5D6A6]/35 blur-[140px] opacity-50" />
        {/* Faint grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(46,140,150,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(46,140,150,0.045)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </div>

      {/* Brand header — fixed at top */}
      <motion.header
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`relative z-20 flex items-center justify-between ${isDesktop ? "px-10 py-6" : "px-5 pt-5 pb-2"}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-accent-primary/25 blur-xl rounded-full scale-125" />
            <img
              alt="Rift"
              src={riftlogo}
              className={`relative z-10 ${isDesktop ? "w-10 h-10" : "w-9 h-9"}`}
            />
          </div>
          <span
            className={`font-semibold text-text-default tracking-[-0.02em] ${isDesktop ? "text-[26px]" : "text-[22px]"}`}
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
              ? "grid grid-cols-[1.1fr_1fr] gap-12 items-center max-w-7xl mx-auto w-full pt-4"
              : "flex flex-col items-center justify-start pt-4"
          }`}
        >
          {/* Left column: copy + CTAs */}
          <div className={isDesktop ? "min-w-0" : "w-full"}>
            {/* Headline */}
            <motion.div
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.55 }}
              className={isDesktop ? "text-left" : "text-left"}
            >
              <h1
                className={`text-text-default leading-[0.98] tracking-[-0.03em] font-semibold ${
                  isDesktop ? "text-[72px]" : "text-[42px]"
                }`}
                style={{ fontFamily: DISPLAY_FONT }}
              >
                Borderless finance,
              </h1>
              <h1
                className={`leading-[0.98] tracking-[-0.03em] font-semibold bg-gradient-to-r from-accent-primary via-[#3BB3BF] to-accent-secondary bg-clip-text text-transparent ${
                  isDesktop ? "text-[72px] mb-5" : "text-[42px] mb-4"
                }`}
                style={{ fontFamily: DISPLAY_FONT }}
              >
                finally simple.
              </h1>
              <p
                className={`text-text-subtle/80 leading-relaxed ${
                  isDesktop ? "text-[17px] max-w-[520px] mb-8" : "text-[15px] mb-6"
                }`}
              >
                A neobank without borders. Hold USD, spend in your local currency, and move money
                across Africa and beyond — in seconds, with fees that make sense.
              </p>
            </motion.div>

            {/* CTA — signup drawer trigger (primary) */}
            <motion.div
              className={`${isDesktop ? "w-full max-w-[440px]" : "w-full"} space-y-3`}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
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
                  <div className="flex items-center gap-3 text-text-subtle/60 text-xs">
                    <div className="flex-1 h-px bg-text-subtle/15" />
                    <span>or</span>
                    <div className="flex-1 h-px bg-text-subtle/15" />
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
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full"
                  >
                    <ActionButton
                      variant="secondary"
                      className={`!h-auto ${isDesktop ? "py-4 text-[16px]" : "py-3.5 text-[15px]"} font-semibold bg-gradient-to-r from-accent-primary to-[#267580] hover:shadow-[0_20px_40px_-12px_rgba(46,140,150,0.5)] transition-all rounded-2xl`}
                    >
                      <span className="flex items-center gap-2">
                        Get started — it's free
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </ActionButton>
                  </motion.div>
                </DrawerTrigger>

                <DrawerContent className={isDesktop ? "max-w-md bg-white overflow-hidden" : "bg-white"}>
                  <DrawerHeader className={`${isDesktop ? "p-6 pb-4" : "p-4"} relative`}>
                    {isDesktop && (
                      <button
                        onClick={onSignupClose}
                        className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-2xl transition-colors"
                      >
                        <FiX className="w-5 h-5 text-gray-500" />
                      </button>
                    )}
                    <DrawerTitle className={isDesktop ? "text-2xl font-semibold" : ""}>Create Your Account</DrawerTitle>
                    <DrawerDescription className={isDesktop ? "text-base mt-2 text-gray-600" : ""}>
                      Start moving between stablecoins and local currency
                    </DrawerDescription>
                  </DrawerHeader>

                  <div className={`w-full flex flex-col ${isDesktop ? "pb-6 px-6" : "pb-4 px-4"} space-y-3`}>
                    {/* Phone Number */}
                    <motion.div
                      whileHover={AUTH_METHODS.phone ? { scale: 1.01 } : undefined}
                      whileTap={AUTH_METHODS.phone ? { scale: 0.99 } : undefined}
                      onClick={() => AUTH_METHODS.phone && handleSignupWithMethod("phone")}
                      className={`w-full flex flex-row items-center gap-4 ${isDesktop ? "p-5" : "p-4"} rounded-2xl transition-all ${
                        AUTH_METHODS.phone
                          ? "cursor-pointer bg-white hover:bg-accent-primary/5 border-2 border-gray-200 hover:border-accent-primary/30 shadow-sm hover:shadow-md"
                          : "cursor-not-allowed bg-gray-50/50 opacity-60 border-2 border-gray-200"
                      }`}
                    >
                      <div className={`${isDesktop ? "w-12 h-12" : "w-10 h-10"} rounded-2xl flex items-center justify-center flex-shrink-0 ${AUTH_METHODS.phone ? "bg-accent-primary/10" : "bg-gray-200"}`}>
                        <HiPhone className={`${isDesktop ? "w-6 h-6" : "text-lg"} ${AUTH_METHODS.phone ? "text-accent-primary" : "text-gray-400"}`} />
                      </div>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <p className={`${isDesktop ? "text-base" : "text-sm"} font-semibold ${AUTH_METHODS.phone ? "text-gray-900" : "text-gray-500"}`}>Phone Number</p>
                        <p className={`${isDesktop ? "text-sm" : "text-xs"} text-gray-500 mt-0.5`}>{AUTH_METHODS.phone ? "Quick verification with SMS" : "Under maintenance"}</p>
                      </div>
                      {!AUTH_METHODS.phone && (
                        <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full whitespace-nowrap flex-shrink-0">MAINTENANCE</span>
                      )}
                    </motion.div>

                    {/* Email Address */}
                    <motion.div
                      whileHover={AUTH_METHODS.email ? { scale: 1.01 } : undefined}
                      whileTap={AUTH_METHODS.email ? { scale: 0.99 } : undefined}
                      onClick={() => AUTH_METHODS.email && handleSignupWithMethod("email")}
                      className={`w-full flex flex-row items-center gap-4 ${isDesktop ? "p-5" : "p-4"} rounded-2xl transition-all ${
                        AUTH_METHODS.email
                          ? "cursor-pointer bg-white hover:bg-accent-primary/5 border-2 border-gray-200 hover:border-accent-primary/30 shadow-sm hover:shadow-md"
                          : "cursor-not-allowed bg-gray-50/50 opacity-60 border-2 border-gray-200"
                      }`}
                    >
                      <div className={`${isDesktop ? "w-12 h-12" : "w-10 h-10"} rounded-2xl flex items-center justify-center flex-shrink-0 ${AUTH_METHODS.email ? "bg-accent-primary/10" : "bg-gray-200"}`}>
                        <HiOutlineMail className={`${isDesktop ? "w-6 h-6" : "text-lg"} ${AUTH_METHODS.email ? "text-accent-primary" : "text-gray-400"}`} />
                      </div>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <p className={`${isDesktop ? "text-base" : "text-sm"} font-semibold ${AUTH_METHODS.email ? "text-gray-900" : "text-gray-500"}`}>Email Address</p>
                        <p className={`${isDesktop ? "text-sm" : "text-xs"} text-gray-500 mt-0.5`}>{AUTH_METHODS.email ? "Verification via email" : "Under maintenance"}</p>
                      </div>
                      {!AUTH_METHODS.email && (
                        <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full whitespace-nowrap flex-shrink-0">MAINTENANCE</span>
                      )}
                    </motion.div>

                    {/* Username & Password */}
                    <motion.div
                      whileHover={AUTH_METHODS.usernamePassword ? { scale: 1.01 } : undefined}
                      whileTap={AUTH_METHODS.usernamePassword ? { scale: 0.99 } : undefined}
                      onClick={() => AUTH_METHODS.usernamePassword && handleSignupWithMethod("username-password")}
                      className={`w-full flex flex-row items-center gap-4 ${isDesktop ? "p-5" : "p-4"} rounded-2xl transition-all ${
                        AUTH_METHODS.usernamePassword
                          ? "cursor-pointer bg-white hover:bg-accent-primary/5 border-2 border-gray-200 hover:border-accent-primary/30 shadow-sm hover:shadow-md"
                          : "cursor-not-allowed bg-gray-50/50 opacity-60 border-2 border-gray-200"
                      }`}
                    >
                      <div className={`${isDesktop ? "w-12 h-12" : "w-10 h-10"} rounded-2xl flex items-center justify-center flex-shrink-0 ${AUTH_METHODS.usernamePassword ? "bg-accent-primary/10" : "bg-gray-200"}`}>
                        <User className={`${isDesktop ? "w-6 h-6" : "w-5 h-5"} ${AUTH_METHODS.usernamePassword ? "text-accent-primary" : "text-gray-400"}`} />
                      </div>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <p className={`${isDesktop ? "text-base" : "text-sm"} font-semibold ${AUTH_METHODS.usernamePassword ? "text-gray-900" : "text-gray-500"}`}>Username & Password</p>
                        <p className={`${isDesktop ? "text-sm" : "text-xs"} text-gray-500 mt-0.5`}>{AUTH_METHODS.usernamePassword ? "Traditional login method" : "Under maintenance"}</p>
                      </div>
                      {!AUTH_METHODS.usernamePassword && (
                        <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full whitespace-nowrap flex-shrink-0">MAINTENANCE</span>
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
                    whileHover={{ scale: 1.005 }}
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
                        className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-2xl transition-colors"
                      >
                        <FiX className="w-5 h-5 text-gray-500" />
                      </button>
                    )}
                    <DrawerTitle className={isDesktop ? "text-2xl font-semibold" : ""}>Welcome Back</DrawerTitle>
                    <DrawerDescription className={isDesktop ? "text-base mt-2 text-gray-600" : ""}>Sign in to access your Rift account</DrawerDescription>
                  </DrawerHeader>

                  <div className={`w-full flex flex-col ${isDesktop ? "pb-6 px-6" : "pb-4 px-4"} space-y-3`}>
                    {/* Phone Number */}
                    <motion.div
                      whileHover={AUTH_METHODS.phone ? { scale: 1.01 } : undefined}
                      whileTap={AUTH_METHODS.phone ? { scale: 0.99 } : undefined}
                      onClick={() => AUTH_METHODS.phone && handleLoginWithMethod("phone")}
                      className={`w-full flex flex-row items-center gap-4 ${isDesktop ? "p-5" : "p-4"} rounded-2xl transition-all ${
                        AUTH_METHODS.phone
                          ? "cursor-pointer bg-white hover:bg-accent-primary/5 border-2 border-gray-200 hover:border-accent-primary/30 shadow-sm hover:shadow-md"
                          : "cursor-not-allowed bg-gray-50/50 opacity-60 border-2 border-gray-200"
                      }`}
                    >
                      <div className={`${isDesktop ? "w-12 h-12" : "w-10 h-10"} rounded-2xl flex items-center justify-center flex-shrink-0 ${AUTH_METHODS.phone ? "bg-accent-primary/10" : "bg-gray-200"}`}>
                        <HiPhone className={`${isDesktop ? "w-6 h-6" : "text-lg"} ${AUTH_METHODS.phone ? "text-accent-primary" : "text-gray-400"}`} />
                      </div>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <p className={`${isDesktop ? "text-base" : "text-sm"} font-semibold ${AUTH_METHODS.phone ? "text-gray-900" : "text-gray-500"}`}>Phone Number</p>
                        <p className={`${isDesktop ? "text-sm" : "text-xs"} text-gray-500 mt-0.5`}>{AUTH_METHODS.phone ? "Login with SMS code" : "Under maintenance"}</p>
                      </div>
                      {!AUTH_METHODS.phone && (
                        <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full whitespace-nowrap flex-shrink-0">MAINTENANCE</span>
                      )}
                    </motion.div>

                    {/* Email Address */}
                    <motion.div
                      whileHover={AUTH_METHODS.email ? { scale: 1.01 } : undefined}
                      whileTap={AUTH_METHODS.email ? { scale: 0.99 } : undefined}
                      onClick={() => AUTH_METHODS.email && handleLoginWithMethod("email")}
                      className={`w-full flex flex-row items-center gap-4 ${isDesktop ? "p-5" : "p-4"} rounded-2xl transition-all ${
                        AUTH_METHODS.email
                          ? "cursor-pointer bg-white hover:bg-accent-primary/5 border-2 border-gray-200 hover:border-accent-primary/30 shadow-sm hover:shadow-md"
                          : "cursor-not-allowed bg-gray-50/50 opacity-60 border-2 border-gray-200"
                      }`}
                    >
                      <div className={`${isDesktop ? "w-12 h-12" : "w-10 h-10"} rounded-2xl flex items-center justify-center flex-shrink-0 ${AUTH_METHODS.email ? "bg-accent-primary/10" : "bg-gray-200"}`}>
                        <HiOutlineMail className={`${isDesktop ? "w-6 h-6" : "text-lg"} ${AUTH_METHODS.email ? "text-accent-primary" : "text-gray-400"}`} />
                      </div>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <p className={`${isDesktop ? "text-base" : "text-sm"} font-semibold ${AUTH_METHODS.email ? "text-gray-900" : "text-gray-500"}`}>Email Address</p>
                        <p className={`${isDesktop ? "text-sm" : "text-xs"} text-gray-500 mt-0.5`}>{AUTH_METHODS.email ? "Login with email code" : "Under maintenance"}</p>
                      </div>
                      {!AUTH_METHODS.email && (
                        <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full whitespace-nowrap flex-shrink-0">MAINTENANCE</span>
                      )}
                    </motion.div>

                    {/* Username & Password */}
                    <motion.div
                      whileHover={AUTH_METHODS.usernamePassword ? { scale: 1.01 } : undefined}
                      whileTap={AUTH_METHODS.usernamePassword ? { scale: 0.99 } : undefined}
                      onClick={() => AUTH_METHODS.usernamePassword && handleLoginWithMethod("username-password")}
                      className={`w-full flex flex-row items-center gap-4 ${isDesktop ? "p-5" : "p-4"} rounded-2xl transition-all ${
                        AUTH_METHODS.usernamePassword
                          ? "cursor-pointer bg-white hover:bg-accent-primary/5 border-2 border-gray-200 hover:border-accent-primary/30 shadow-sm hover:shadow-md"
                          : "cursor-not-allowed bg-gray-50/50 opacity-60 border-2 border-gray-200"
                      }`}
                    >
                      <div className={`${isDesktop ? "w-12 h-12" : "w-10 h-10"} rounded-2xl flex items-center justify-center flex-shrink-0 ${AUTH_METHODS.usernamePassword ? "bg-accent-primary/10" : "bg-gray-200"}`}>
                        <User className={`${isDesktop ? "w-6 h-6" : "w-5 h-5"} ${AUTH_METHODS.usernamePassword ? "text-accent-primary" : "text-gray-400"}`} />
                      </div>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <p className={`${isDesktop ? "text-base" : "text-sm"} font-semibold ${AUTH_METHODS.usernamePassword ? "text-gray-900" : "text-gray-500"}`}>Username & Password</p>
                        <p className={`${isDesktop ? "text-sm" : "text-xs"} text-gray-500 mt-0.5`}>{AUTH_METHODS.usernamePassword ? "Login with credentials" : "Under maintenance"}</p>
                      </div>
                      {!AUTH_METHODS.usernamePassword && (
                        <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full whitespace-nowrap flex-shrink-0">MAINTENANCE</span>
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
              transition={{ delay: 0.6, duration: 0.4 }}
              className={`flex items-center gap-3 text-[12px] text-text-subtle/80 ${isDesktop ? "mt-7" : "mt-5"}`}
            >
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-accent-primary" />
                <span className="font-medium">Bank-grade security</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-text-subtle/30" />
              <span>Instant transfers</span>
              <div className="w-1 h-1 rounded-full bg-text-subtle/30" />
              <span>Low fees</span>
            </motion.div>
          </div>

          {/* Right column: hero visual — desktop only */}
          {isDesktop && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="relative flex items-center justify-center"
            >
              <div className="relative w-full max-w-[440px]">
                {/* Main wallet preview card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="relative rounded-[28px] p-6 bg-gradient-to-br from-[#0F2A38] via-[#133847] to-[#164455] text-white shadow-[0_30px_60px_-20px_rgba(15,42,56,0.35)] overflow-hidden"
                >
                  {/* Glow accents */}
                  <div className="absolute -top-20 -right-20 w-60 h-60 bg-accent-primary/25 blur-3xl rounded-full" />
                  <div className="absolute -bottom-24 -left-16 w-52 h-52 bg-[#F5D6A6]/15 blur-3xl rounded-full" />

                  <div className="relative flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <img src={riftlogo} alt="Rift" className="w-6 h-6" />
                      </div>
                      <span className="font-semibold text-[15px] tracking-[-0.01em]" style={{ fontFamily: DISPLAY_FONT }}>
                        Rift
                      </span>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.1em] text-white/60 font-medium">
                      Multi-currency
                    </span>
                  </div>

                  <div className="relative">
                    <p className="text-[11px] uppercase tracking-[0.1em] text-white/50 font-medium mb-1.5">
                      Available balance
                    </p>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[44px] font-semibold leading-none tracking-[-0.03em]" style={{ fontFamily: DISPLAY_FONT }}>
                        $4,218
                      </span>
                      <span className="text-[22px] font-semibold text-white/60 tracking-[-0.02em]" style={{ fontFamily: DISPLAY_FONT }}>
                        .92
                      </span>
                    </div>
                    <p className="text-[12px] text-white/50" style={{ fontFamily: MONO_FONT }}>
                      ≈ KES 545,221.48
                    </p>
                  </div>

                  {/* Supported currencies row */}
                  <div className="relative mt-6">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-white/45 font-medium mb-2">
                      Send & receive in
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { flag: "🇺🇸", code: "USD" },
                        { flag: "🇰🇪", code: "KES" },
                        { flag: "🇳🇬", code: "NGN" },
                        { flag: "🇺🇬", code: "UGX" },
                        { flag: "🇹🇿", code: "TZS" },
                        { flag: "🇧🇷", code: "BRL" },
                      ].map((c) => (
                        <span
                          key={c.code}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/8 border border-white/10 text-[11px] font-medium text-white/90"
                        >
                          <span className="leading-none">{c.flag}</span>
                          <span style={{ fontFamily: MONO_FONT }}>{c.code}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="relative mt-5 grid grid-cols-3 gap-2">
                    {[
                      { label: "Send", icon: Send },
                      { label: "Buy", icon: DollarSign },
                      { label: "Pay", icon: CreditCard },
                    ].map((action) => (
                      <div
                        key={action.label}
                        className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl bg-white/8 border border-white/10"
                      >
                        <action.icon className="w-4 h-4 text-white/85" />
                        <span className="text-[11px] font-medium text-white/85">{action.label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Activity strip below the card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75, duration: 0.4 }}
                  className="mt-4 p-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-surface/70 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-text-subtle/80">
                      Recent
                    </span>
                    <span className="text-[11px] text-text-subtle/70">Today</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { label: "Deposit · M-Pesa", amount: "+ $500.00", positive: true },
                      { label: "Transfer · Lagos", amount: "− $120.00", positive: false },
                    ].map((tx) => (
                      <div key={tx.label} className="flex items-center justify-between">
                        <span className="text-[13px] text-text-default font-medium">{tx.label}</span>
                        <span
                          className={`text-[13px] font-semibold ${tx.positive ? "text-emerald-600" : "text-text-default/70"}`}
                          style={{ fontFamily: MONO_FONT }}
                        >
                          {tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Mobile-only: feature chips grid under CTAs */}
          {!isDesktop && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="mt-6 grid grid-cols-2 gap-2.5"
            >
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex flex-col items-start gap-2 p-3.5 rounded-2xl bg-white/70 backdrop-blur-sm border border-surface/70 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-primary to-[#267580] flex items-center justify-center shadow-[0_6px_14px_-4px_rgba(46,140,150,0.4)]">
                    <feature.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-text-default leading-tight">{feature.title}</p>
                    <p className="text-[11px] text-text-subtle/75 leading-snug mt-0.5">{feature.description}</p>
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
