import { useFlow } from "../context";
import spherelogo from "@/assets/sphere.png";
import ActionButton from "@/components/ui/action-button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Mail, Phone, User } from "lucide-react";

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
    <div className="w-full h-full flex flex-col p-5 items-center justify-between">
      <div />
      <div className="flex flex-col items-center gap-5">
        <div className="flex flex-col">
          <div className="w-[150px] h-[150px] rounded-full overflow-hidden">
            <img
              alt="sphere-logo"
              src={spherelogo}
              className="w-[150px] h-[150px]"
            />
          </div>
        </div>
        <div>
          <p className="font-semibold text-text-default text-3xl text-center">
            <span>Your Secure</span> <br /> <span>multichain Wallet</span>
          </p>
        </div>

        <p className="text-muted-foreground text-center">
          Create your <span className="font-semibold">secure</span> multichain
          wallet
        </p>

        <div className="flex flex-col items-center gap-2">
          {/* Signup Drawer */}
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
              <ActionButton variant={"secondary"}>
                <p className="text-text-default text-md">Create a New Wallet</p>
              </ActionButton>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Choose Authentication Method</DrawerTitle>
                <DrawerDescription>
                  Select how you'd like to create your account
                </DrawerDescription>
              </DrawerHeader>
              <div className="w-full px-5 pb-5 gap-3 flex flex-col">
                <div
                  onClick={() => handleSignupWithMethod("phone")}
                  className="w-full flex flex-row items-center gap-4 rounded-md active:bg-input px-4 py-4 cursor-pointer active:scale-95 border border-accent"
                >
                  <Phone className="text-accent-secondary" size={24} />
                  <div className="flex flex-col items-start">
                    <p className="font-semibold">Phone Number</p>
                    <p className="text-sm text-muted-foreground">
                      Verify with SMS code
                    </p>
                  </div>
                </div>
                <div
                  onClick={() => handleSignupWithMethod("email")}
                  className="w-full flex flex-row items-center gap-4 rounded-md active:bg-input px-4 py-4 cursor-pointer active:scale-95 border border-accent"
                >
                  <Mail className="text-accent-secondary" size={24} />
                  <div className="flex flex-col items-start">
                    <p className="font-semibold">Email Address</p>
                    <p className="text-sm text-muted-foreground">
                      Verify with email code
                    </p>
                  </div>
                </div>
                <div
                  onClick={() => handleSignupWithMethod("username-password")}
                  className="w-full flex flex-row items-center gap-4 rounded-md active:bg-input px-4 py-4 cursor-pointer active:scale-95 border border-accent"
                >
                  <User className="text-accent-secondary" size={24} />
                  <div className="flex flex-col items-start">
                    <p className="font-semibold">Username & Password</p>
                    <p className="text-sm text-muted-foreground">
                      Traditional login credentials
                    </p>
                  </div>
                </div>
              </div>
            </DrawerContent>
          </Drawer>

          {/* Login Drawer */}
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
              <ActionButton variant={"ghost"}>
                <p className="text-text-default text-md">Login</p>
              </ActionButton>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Login to Your Account</DrawerTitle>
                <DrawerDescription>
                  Select your preferred login method
                </DrawerDescription>
              </DrawerHeader>
              <div className="w-full px-5 pb-5 gap-3 flex flex-col">
                <div
                  onClick={() => handleLoginWithMethod("phone")}
                  className="w-full flex flex-row items-center gap-4 rounded-md active:bg-input px-4 py-4 cursor-pointer active:scale-95 border border-accent"
                >
                  <Phone className="text-accent-secondary" size={24} />
                  <div className="flex flex-col items-start">
                    <p className="font-semibold">Phone Number</p>
                    <p className="text-sm text-muted-foreground">
                      Login with SMS code
                    </p>
                  </div>
                </div>
                <div
                  onClick={() => handleLoginWithMethod("email")}
                  className="w-full flex flex-row items-center gap-4 rounded-md active:bg-input px-4 py-4 cursor-pointer active:scale-95 border border-accent"
                >
                  <Mail className="text-accent-secondary" size={24} />
                  <div className="flex flex-col items-start">
                    <p className="font-semibold">Email Address</p>
                    <p className="text-sm text-muted-foreground">
                      Login with email code
                    </p>
                  </div>
                </div>
                <div
                  onClick={() => handleLoginWithMethod("username-password")}
                  className="w-full flex flex-row items-center gap-4 rounded-md active:bg-input px-4 py-4 cursor-pointer active:scale-95 border border-accent"
                >
                  <User className="text-accent-secondary" size={24} />
                  <div className="flex flex-col items-start">
                    <p className="font-semibold">Username & Password</p>
                    <p className="text-sm text-muted-foreground">
                      Login with credentials
                    </p>
                  </div>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
      <div className="flex flex-col items-center w-4/5">
        <p className="text-muted-foreground text-center">
          By using Sphere Wallet, you agree to accept our{" "}
          <span className="font-semibold cursor-pointer">Terms of Use</span> and{" "}
          <span className="font-semibold cursor-pointer">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
