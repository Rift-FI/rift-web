import useWalletAuth, {
  signInArgs,
  signUpArgs,
} from "@/hooks/wallet/use-wallet-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginResponse, SignupResponse } from "@stratosphere-network/wallet";
import { UseMutationResult } from "@tanstack/react-query";
import { createContext, ReactNode, useContext } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";

const stepsSchema = z.enum([
  "start",
  "phone",
  "email",
  "username-password",
  "otp",
  "created",
  "login-phone",
  "login-email",
  "login-username-password",
  "login-code",
  "auth-check",
  "v1-recovery",
]);

const authMethodSchema = z.enum(["phone", "email", "username-password"]);

const onboardingSchema = z.object({
  steps: stepsSchema,
  authMethod: authMethodSchema.optional(),
  identifier: z.string().optional(),
  email: z.string().optional(),
  externalId: z.string().optional(),
  password: z.string().optional(),
  code: z.string().optional(),
});

type ONBOARDING_SCHEMA = z.infer<typeof onboardingSchema>;

interface OnboardingContext {
  stateControl: UseFormReturn<ONBOARDING_SCHEMA>;
  currentStep: ONBOARDING_SCHEMA["steps"];
  goToNext: (step?: ONBOARDING_SCHEMA["steps"]) => void;
  gotBack: (step?: ONBOARDING_SCHEMA["steps"]) => void;
  signInMutation: UseMutationResult<
    LoginResponse,
    Error,
    signInArgs,
    unknown
  > | null;
  signUpMutation: UseMutationResult<
    SignupResponse,
    Error,
    signUpArgs,
    unknown
  > | null;
}

const OnboardingContext = createContext<OnboardingContext>({
  stateControl: {} as unknown as any,
  currentStep: "auth-check",
  gotBack(step) {},
  goToNext(step) {},
  signInMutation: null,
  signUpMutation: null,
});

interface Props {
  children: ReactNode;
}
export default function OnboardingContextProvider(props: Props) {
  const { children } = props;

  const { signInMutation, signUpMutation } = useWalletAuth();
  const control = useForm<ONBOARDING_SCHEMA>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      code: "",
      identifier: "",
      email: "",
      externalId: "",
      password: "",
      authMethod: undefined,
      steps: "auth-check",
    },
  });

  const CURRENT = control.watch("steps");

  function next(step?: OnboardingContext["currentStep"]) {
    console.log("moving", CURRENT);
    if (step) {
      control.setValue("steps", step);
      return;
    }
    const authMethod = control.getValues("authMethod");
    switch (CURRENT) {
      case "start": {
        // Default to phone if no auth method set
        const nextStep =
          authMethod === "email"
            ? "email"
            : authMethod === "username-password"
            ? "username-password"
            : "phone";
        control.setValue("steps", nextStep);
        return;
      }
      case "phone":
      case "email": {
        control.setValue("steps", "otp");
        return;
      }
      case "username-password": {
        control.setValue("steps", "created");
        return;
      }
      case "otp": {
        control.setValue("steps", "created");
        return;
      }
      case "login-phone":
      case "login-email": {
        control.setValue("steps", "login-code");
        return;
      }
      case "login-username-password": {
        // Username/password login goes straight to app, no created step
        return;
      }
      case "v1-recovery": {
        control.setValue("steps", "created");
        return;
      }
      default: {
        return;
      }
    }
  }

  function prev(step?: OnboardingContext["currentStep"]) {
    if (step) {
      control.setValue("steps", step);
      return;
    }
    const authMethod = control.getValues("authMethod");
    switch (CURRENT) {
      case "phone":
      case "email":
      case "username-password": {
        control.setValue("steps", "start");
        return;
      }
      case "otp": {
        const prevStep = authMethod === "email" ? "email" : "phone";
        control.setValue("steps", prevStep);
        return;
      }
      case "created": {
        if (authMethod === "username-password") {
          control.setValue("steps", "username-password");
        } else {
          control.setValue("steps", "otp");
        }
        return;
      }
      case "login-code": {
        const prevStep = authMethod === "email" ? "login-email" : "login-phone";
        control.setValue("steps", prevStep);
        return;
      }
      case "login-phone":
      case "login-email":
      case "login-username-password": {
        control.setValue("steps", "start");
        return;
      }
      case "v1-recovery": {
        control.setValue("steps", "start");
        return;
      }
      default: {
        return;
      }
    }
  }

  return (
    <OnboardingContext.Provider
      value={{
        stateControl: control,
        currentStep: CURRENT,
        gotBack: prev,
        goToNext: next,
        signInMutation,
        signUpMutation,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useFlow() {
  const context = useContext(OnboardingContext);

  return context;
}
