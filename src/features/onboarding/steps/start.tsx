import { motion } from "motion/react";
import { HiPhone } from "react-icons/hi";
import { User, Smartphone, Send, Wallet, Zap, TrendingUp } from "lucide-react";
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

export default function Start() {
  const flow = useFlow();

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

  const handleSignupWithMethod = (
    method: "phone" | "username-password"
  ) => {
    flow.stateControl.setValue("authMethod", method);
    onSignupClose();
    flow.goToNext();
  };

  const handleLoginWithMethod = (
    method: "phone" | "username-password"
  ) => {
    flow.stateControl.setValue("authMethod", method);
    onLoginClose();

    const loginStep =
      method === "phone"
        ? "login-phone"
        : "login-username-password";
    flow.goToNext(loginStep);
  };

  return (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-full flex flex-col"
    >
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-6">
        <motion.img 
          alt="rift" 
          src={riftlogo} 
          className="w-24 h-24 mb-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        />

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-3">Welcome to Rift</h1>
          <p className="text-text-subtle text-base max-w-sm">
            Send money across Africa & earn yield from global businesses
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div 
          className="w-full max-w-sm space-y-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-start gap-3 p-3 bg-surface-subtle rounded-lg">
            <div className="w-10 h-10 bg-accent-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Mobile Money & Crypto</h3>
              <p className="text-xs text-text-subtle">
                Send to M-Pesa, Telebirr & more. Receive USDC on Base.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-surface-subtle rounded-lg">
            <div className="w-10 h-10 bg-accent-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Instant Transfers</h3>
              <p className="text-xs text-text-subtle">
                Real-time exchange rates. Money arrives in seconds.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-surface-subtle rounded-lg">
            <div className="w-10 h-10 bg-accent-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Multi-Currency Wallet</h3>
              <p className="text-xs text-text-subtle">
                Support for KES, ETB, UGX, GHS & USDC in one wallet.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 rounded-lg border border-accent-primary/20">
            <div className="w-10 h-10 bg-accent-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Rift Yield Vaults</h3>
              <p className="text-xs text-text-subtle">
                Earn returns from businesses in Shenzhen, Hong Kong & Africa with proven cashflows and 30-50% margins.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* CTA Buttons */}
      <motion.div 
        className="w-full px-6 pb-6 space-y-3"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
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
          <DrawerTrigger className="w-full">
            <ActionButton variant="secondary" className="p-4 text-base font-semibold">
              Get Started
            </ActionButton>
          </DrawerTrigger>

          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Create Rift Account</DrawerTitle>
              <DrawerDescription>
                Start accepting payments with USDC and M-Pesa
              </DrawerDescription>
            </DrawerHeader>

            <div className="w-full flex flex-col pb-4">
              <div
                onClick={() => handleSignupWithMethod("phone")}
                className="w-full flex flex-row items-center gap-3 p-3 cursor-pointer border-t-2 border-b-2 border-surface"
              >
                <HiPhone className="text-text-subtle text-xl" />

                <div className="flex flex-col items-start">
                  <p className="text-sm font-medium">Phone Number</p>
                  <p className="text-sm text-muted-foreground">
                    Verify with SMS code
                  </p>
                </div>
              </div>


              <div
                onClick={() => handleSignupWithMethod("username-password")}
                className="w-full flex flex-row items-center gap-3 p-3 cursor-pointer border-b-2 border-surface"
              >
                <User className="text-text-subtle" />

                <div className="flex flex-col items-start">
                  <p className="text-sm font-medium">Username & Password</p>
                  <p className="text-sm text-muted-foreground">
                    Choose a username & password
                  </p>
                </div>
              </div>
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
          <DrawerTrigger className="w-full">
            <ActionButton
              variant="ghost"
              className="border-0 bg-surface-subtle p-4 text-base font-medium"
            >
              Already have an account? Sign In
            </ActionButton>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Login to your Rift Account</DrawerTitle>
              <DrawerDescription>
                Access your payment solutions dashboard
              </DrawerDescription>
            </DrawerHeader>

            <div className="w-full flex flex-col pb-4">
              <div
                onClick={() => handleLoginWithMethod("phone")}
                className="w-full flex flex-row items-center gap-3 p-3 cursor-pointer border-t-2 border-b-2 border-surface"
              >
                <HiPhone className="text-text-subtle text-xl" />

                <div className="flex flex-col items-start">
                  <p className="text-sm font-medium">Phone Number</p>
                  <p className="text-sm text-muted-foreground">
                    Login with SMS code
                  </p>
                </div>
              </div>
              <div
                onClick={() => handleLoginWithMethod("username-password")}
                className="w-full flex flex-row items-center gap-3 p-3 cursor-pointer border-b-2 border-surface"
              >
                <User className="text-text-subtle text-xl" />
                <div className="flex flex-col items-start">
                  <p className="text-sm font-medium">Username & Password</p>
                  <p className="text-sm text-muted-foreground">
                    Login with credentials
                  </p>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </motion.div>
    </motion.div>
  );
}
