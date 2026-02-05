import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { motion } from "motion/react";
import { HiPhone } from "react-icons/hi";
import { HiOutlineMail } from "react-icons/hi";
import { User, Globe, Send, TrendingUp, Shield, Sparkles } from "lucide-react";
import { FiX } from "react-icons/fi";
import { useFlow } from "../context";
import { useDisclosure } from "@/hooks/use-disclosure";
import ActionButton from "@/components/ui/action-button";
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

// Animated floating orbs for background
const FloatingOrb = ({ delay, size, x, y }: { delay: number; size: number; x: string; y: string }) => (
  <motion.div
    className="absolute rounded-full bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 blur-xl"
    style={{ width: size, height: size, left: x, top: y }}
    animate={{
      y: [0, -20, 0],
      scale: [1, 1.1, 1],
      opacity: [0.3, 0.5, 0.3],
    }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Animated connection lines (representing global transfers)
const ConnectionLine = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute h-[1px] bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent"
    style={{ width: "60%", left: "20%" }}
    initial={{ scaleX: 0, opacity: 0 }}
    animate={{ scaleX: 1, opacity: [0, 1, 0] }}
    transition={{
      duration: 2,
      delay,
      repeat: Infinity,
      repeatDelay: 1,
    }}
  />
);

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
      icon: Globe,
      title: "Spend Anywhere",
      description: "Pay bills, shop online & swipe globally with digital USD",
      delay: 0.2,
    },
    {
      icon: Send,
      title: "Send & Receive",
      description: "Fast cross-border transfers to any bank or mobile wallet",
      delay: 0.3,
    },
    {
      icon: TrendingUp,
      title: "Grow Wealth",
      description: "Access global stocks, bonds & real-yield products",
      delay: 0.4,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`w-full h-full flex flex-col relative overflow-hidden bg-app-background ${isDesktop ? "bg-gray-50" : ""}`}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingOrb delay={0} size={120} x="10%" y="15%" />
        <FloatingOrb delay={1} size={80} x="70%" y="10%" />
        <FloatingOrb delay={2} size={100} x="80%" y="60%" />
        <FloatingOrb delay={1.5} size={60} x="5%" y="70%" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(46,140,150,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(46,140,150,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Main Content Container */}
      <div className={`flex-1 flex flex-col ${isDesktop ? "max-w-6xl mx-auto w-full px-8 py-12" : "px-4 sm:px-6 md:px-8"} relative z-10`}>
        {/* Hero Section */}
        <div className={`flex-1 flex flex-col ${isDesktop ? "items-start justify-center" : "items-center justify-center"} ${isDesktop ? "pt-0" : "pt-6 sm:pt-8 pb-4"}`}>
          {/* Logo with glow effect */}
          <motion.div
            className={`relative ${isDesktop ? "mb-8" : "mb-4"}`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
          >
            <div className="absolute inset-0 bg-accent-primary/30 blur-2xl rounded-full scale-150" />
            <img alt="rift" src={riftlogo} className={`${isDesktop ? "w-24 h-24" : "w-20 h-20"} relative z-10`} />
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className={`${isDesktop ? "text-left mb-8" : "text-center mb-6"}`}
          >
            <h1 className={`${isDesktop ? "text-6xl" : "text-3xl"} font-bold mb-2 bg-gradient-to-r from-text-default via-accent-primary to-accent-secondary bg-clip-text text-transparent`}>
              Bank globally.
            </h1>
            <h1 className={`${isDesktop ? "text-6xl" : "text-3xl"} font-bold mb-3 text-text-default`}>
              Live locally.
            </h1>
            <p className={`text-text-subtle ${isDesktop ? "text-lg max-w-2xl" : "text-sm max-w-xs mx-auto"} leading-relaxed`}>
              Your global USD account for payments, transfers & wealth building.
            </p>
          </motion.div>

          {/* Animated connection visualization - Hide on desktop */}
          {!isDesktop && (
            <motion.div 
              className="relative w-full h-8 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <ConnectionLine delay={0} />
              <ConnectionLine delay={1.5} />
            </motion.div>
          )}

          {/* Feature Cards - Grid on desktop, stacked on mobile */}
          <div className={`w-full ${isDesktop ? "grid grid-cols-3 gap-4 mb-8" : "max-w-sm md:max-w-md space-y-4 sm:space-y-5"}`}>
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: feature.delay, duration: 0.4 }}
                className={`${isDesktop ? "bg-white p-6" : "bg-surface-subtle/80 backdrop-blur-sm p-3"} flex ${isDesktop ? "flex-col items-start" : "items-center"} gap-3 rounded-2xl border border-gray-200 hover:border-accent-primary/30 transition-colors shadow-sm`}
              >
                <motion.div 
                  className={`${isDesktop ? "w-12 h-12 mb-4" : "w-10 h-10"} bg-gradient-to-br from-accent-primary to-accent-secondary rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent-primary/20`}
                  whileHover={{ scale: 1.05 }}
                >
                  <feature.icon className={`${isDesktop ? "w-6 h-6" : "w-5 h-5"} text-white`} />
                </motion.div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${isDesktop ? "text-base mb-2" : "text-sm"} text-text-default`}>{feature.title}</h3>
                  <p className={`text-text-subtle ${isDesktop ? "text-sm" : "text-xs"} leading-tight`}>
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className={`flex items-center gap-4 ${
              isDesktop ? "text-sm mt-4" : "text-xs mt-6"
            } text-text-subtle`}
          >
            <div className="flex items-center gap-1">
              <Shield className={`${isDesktop ? "w-4 h-4" : "w-3 h-3"} text-accent-primary`} />
              <span>Secure</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-text-subtle/30" />
            <div className="flex items-center gap-1">
              <Sparkles className={`${isDesktop ? "w-4 h-4" : "w-3 h-3"} text-accent-primary`} />
              <span>Instant</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-text-subtle/30" />
            <div className="flex items-center gap-1">
              <Globe className={`${isDesktop ? "w-4 h-4" : "w-3 h-3"} text-accent-primary`} />
              <span>Global</span>
            </div>
          </motion.div>
        </div>

        {/* CTA Buttons */}
        <motion.div 
          className={`${isDesktop ? "w-full max-w-md" : "w-full px-6"} pb-6 space-y-3 relative z-10`}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
        <Drawer
          open={isSignupOpen}
          onClose={onSignupClose}
          onOpenChange={(open) => {
            if (open) {
              onSignupOpen();
            } else {
              onSignupClose();
            }
          }}
        >
          <DrawerTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full"
            >
              <ActionButton 
                variant="secondary" 
                className={`${isDesktop ? "py-5 px-6 text-lg" : "py-4 px-4 text-base"} font-semibold bg-gradient-to-r from-accent-primary to-accent-secondary hover:shadow-lg hover:shadow-accent-primary/30 transition-shadow rounded-2xl`}
              >
                Get Started — It's Free
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
                Join thousands building the future of global finance
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
                <div className={`${isDesktop ? "w-12 h-12" : "w-10 h-10"} rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  AUTH_METHODS.phone ? "bg-accent-primary/10" : "bg-gray-200"
                }`}>
                  <HiPhone className={`${isDesktop ? "w-6 h-6" : "text-lg"} ${AUTH_METHODS.phone ? "text-accent-primary" : "text-gray-400"}`} />
                </div>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <p className={`${isDesktop ? "text-base" : "text-sm"} font-semibold ${AUTH_METHODS.phone ? "text-gray-900" : "text-gray-500"}`}>
                    Phone Number
                  </p>
                  <p className={`${isDesktop ? "text-sm" : "text-xs"} text-gray-500 mt-0.5`}>
                    {AUTH_METHODS.phone ? "Quick verification with SMS" : "Under maintenance"}
                  </p>
                </div>
                {!AUTH_METHODS.phone && (
                  <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full whitespace-nowrap flex-shrink-0">
                    MAINTENANCE
                  </span>
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
                <div className={`${isDesktop ? "w-12 h-12" : "w-10 h-10"} rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  AUTH_METHODS.email ? "bg-accent-primary/10" : "bg-gray-200"
                }`}>
                  <HiOutlineMail className={`${isDesktop ? "w-6 h-6" : "text-lg"} ${AUTH_METHODS.email ? "text-accent-primary" : "text-gray-400"}`} />
                </div>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <p className={`${isDesktop ? "text-base" : "text-sm"} font-semibold ${AUTH_METHODS.email ? "text-gray-900" : "text-gray-500"}`}>
                    Email Address
                  </p>
                  <p className={`${isDesktop ? "text-sm" : "text-xs"} text-gray-500 mt-0.5`}>
                    {AUTH_METHODS.email ? "Verification via email" : "Under maintenance"}
                  </p>
                </div>
                {!AUTH_METHODS.email && (
                  <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full whitespace-nowrap flex-shrink-0">
                    MAINTENANCE
                  </span>
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
                <div className={`${isDesktop ? "w-12 h-12" : "w-10 h-10"} rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  AUTH_METHODS.usernamePassword ? "bg-accent-primary/10" : "bg-gray-200"
                }`}>
                  <User className={`${isDesktop ? "w-6 h-6" : "w-5 h-5"} ${AUTH_METHODS.usernamePassword ? "text-accent-primary" : "text-gray-400"}`} />
                </div>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <p className={`${isDesktop ? "text-base" : "text-sm"} font-semibold ${AUTH_METHODS.usernamePassword ? "text-gray-900" : "text-gray-500"}`}>
                    Username & Password
                  </p>
                  <p className={`${isDesktop ? "text-sm" : "text-xs"} text-gray-500 mt-0.5`}>
                    {AUTH_METHODS.usernamePassword ? "Traditional login method" : "Under maintenance"}
                  </p>
                </div>
                {!AUTH_METHODS.usernamePassword && (
                  <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full whitespace-nowrap flex-shrink-0">
                    MAINTENANCE
                  </span>
                )}
              </motion.div>
            </div>
          </DrawerContent>
        </Drawer>

        <Drawer
          open={isLoginOpen}
          onClose={onLoginClose}
          onOpenChange={(open) => {
            if (open) {
              onLoginOpen();
            } else {
              onLoginClose();
            }
          }}
        >
          <DrawerTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`w-full ${isDesktop ? "py-4 text-base" : "py-3 text-sm"} font-medium text-text-subtle hover:text-accent-primary transition-colors`}
            >
              Already have an account? <span className="text-accent-primary font-semibold">Sign In</span>
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
              <DrawerDescription className={isDesktop ? "text-base mt-2 text-gray-600" : ""}>
                Sign in to access your Rift wallet
              </DrawerDescription>
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
                <div className={`${isDesktop ? "w-12 h-12" : "w-10 h-10"} rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  AUTH_METHODS.phone ? "bg-accent-primary/10" : "bg-gray-200"
                }`}>
                  <HiPhone className={`${isDesktop ? "w-6 h-6" : "text-lg"} ${AUTH_METHODS.phone ? "text-accent-primary" : "text-gray-400"}`} />
                </div>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <p className={`${isDesktop ? "text-base" : "text-sm"} font-semibold ${AUTH_METHODS.phone ? "text-gray-900" : "text-gray-500"}`}>
                    Phone Number
                  </p>
                  <p className={`${isDesktop ? "text-sm" : "text-xs"} text-gray-500 mt-0.5`}>
                    {AUTH_METHODS.phone ? "Login with SMS code" : "Under maintenance"}
                  </p>
                </div>
                {!AUTH_METHODS.phone && (
                  <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full whitespace-nowrap flex-shrink-0">
                    MAINTENANCE
                  </span>
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
                <div className={`${isDesktop ? "w-12 h-12" : "w-10 h-10"} rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  AUTH_METHODS.email ? "bg-accent-primary/10" : "bg-gray-200"
                }`}>
                  <HiOutlineMail className={`${isDesktop ? "w-6 h-6" : "text-lg"} ${AUTH_METHODS.email ? "text-accent-primary" : "text-gray-400"}`} />
                </div>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <p className={`${isDesktop ? "text-base" : "text-sm"} font-semibold ${AUTH_METHODS.email ? "text-gray-900" : "text-gray-500"}`}>
                    Email Address
                  </p>
                  <p className={`${isDesktop ? "text-sm" : "text-xs"} text-gray-500 mt-0.5`}>
                    {AUTH_METHODS.email ? "Login with email code" : "Under maintenance"}
                  </p>
                </div>
                {!AUTH_METHODS.email && (
                  <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full whitespace-nowrap flex-shrink-0">
                    MAINTENANCE
                  </span>
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
                <div className={`${isDesktop ? "w-12 h-12" : "w-10 h-10"} rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  AUTH_METHODS.usernamePassword ? "bg-accent-primary/10" : "bg-gray-200"
                }`}>
                  <User className={`${isDesktop ? "w-6 h-6" : "w-5 h-5"} ${AUTH_METHODS.usernamePassword ? "text-accent-primary" : "text-gray-400"}`} />
                </div>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <p className={`${isDesktop ? "text-base" : "text-sm"} font-semibold ${AUTH_METHODS.usernamePassword ? "text-gray-900" : "text-gray-500"}`}>
                    Username & Password
                  </p>
                  <p className={`${isDesktop ? "text-sm" : "text-xs"} text-gray-500 mt-0.5`}>
                    {AUTH_METHODS.usernamePassword ? "Login with credentials" : "Under maintenance"}
                  </p>
                </div>
                {!AUTH_METHODS.usernamePassword && (
                  <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full whitespace-nowrap flex-shrink-0">
                    MAINTENANCE
                  </span>
                )}
              </motion.div>
            </div>
          </DrawerContent>
        </Drawer>
        </motion.div>
      </div>
    </motion.div>
  );
}
