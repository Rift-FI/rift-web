import { motion } from "motion/react";
import { HiPhone } from "react-icons/hi";
import { MdAlternateEmail } from "react-icons/md";
import { User } from "lucide-react";
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
import spherelogo from "@/assets/sphere.png";

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

  return (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-full"
    >
      <div className="w-full flex flex-col items-center gap-2 absolute top-1/3 left-1/2 -translate-1/2 transform">
        <img alt="sphere" src={spherelogo} className="w-[9rem] h-[9rem]" />

        <div>
          <p className="text-center">Sphere</p>
          <p className="text-text-default text-2xl text-center font-medium">
            <span>Your Secure</span> <br /> <span>multi-chain wallet</span>
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-4 right-4 flex flex-col items-center gap-2 pb-4">
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
            <ActionButton variant="secondary" className="p-[0.625rem]">
              <p className="text-text-default text-md">Create a New Wallet</p>
            </ActionButton>
          </DrawerTrigger>

          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Create a new wallet</DrawerTitle>
              <DrawerDescription>
                Select how you'd like to create your wallet
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
                onClick={() => handleSignupWithMethod("email")}
                className="w-full flex flex-row items-center gap-3 p-3 cursor-pointer border-b-2 border-surface"
              >
                <MdAlternateEmail className="text-text-subtle text-xl" />

                <div className="flex flex-col items-start">
                  <p className="text-sm font-medium">Email Address</p>
                  <p className="text-sm text-muted-foreground">
                    Verify with email code
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
              className="border-0 bg-surface-subtle p-[0.625rem]"
            >
              <p className="text-text-default text-md">Login</p>
            </ActionButton>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Login to your Wallet</DrawerTitle>
              <DrawerDescription>
                Select your preferred login method
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
                onClick={() => handleLoginWithMethod("email")}
                className="w-full flex flex-row items-center gap-3 p-3 cursor-pointer border-b-2 border-surface"
              >
                <MdAlternateEmail className="text-text-subtle text-xl" />

                <div className="flex flex-col items-start">
                  <p className="text-sm font-medium">Email Address</p>
                  <p className="text-sm text-muted-foreground">
                    Login with email code
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
      </div>
    </motion.div>
  );
}
