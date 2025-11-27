import { createContext, ReactNode, useContext } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginResponse, SignupResponse } from "@rift-finance/wallet";
import { UseMutationResult } from "@tanstack/react-query";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import useWalletAuth, {
  signInArgs,
  signUpArgs,
} from "@/hooks/wallet/use-wallet-auth";

const stepsSchema = z.enum([
  "start",
  "phone",
  "email",
  "username-password",
  "otp",
  "email-otp",
  "created",
  "login-phone",
  "login-email",
  "login-username-password",
  "login-code",
  "login-email-code",
  "auth-check",
  "forgot-password",
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
  phonesearchfilter: z.string().optional(),
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
    if (step) {
      control.setValue("steps", step);
      return;
    }
    const authMethod = control.getValues("authMethod");
    switch (CURRENT) {
      case "start": {
        const nextStep =
          authMethod === "username-password"
            ? "username-password"
            : authMethod === "email"
            ? "email"
            : "phone";
        control.setValue("steps", nextStep);
        return;
      }
      case "phone": {
        control.setValue("steps", "otp");
        return;
      }
      case "email": {
        control.setValue("steps", "email-otp");
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
      case "email-otp": {
        control.setValue("steps", "created");
        return;
      }
      case "login-phone": {
        control.setValue("steps", "login-code");
        return;
      }
      case "login-email": {
        control.setValue("steps", "login-email-code");
        return;
      }
      case "login-username-password": {
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
        control.setValue("steps", "phone");
        return;
      }
      case "email-otp": {
        control.setValue("steps", "email");
        return;
      }
      case "created": {
        if (authMethod === "username-password") {
          control.setValue("steps", "username-password");
        } else if (authMethod === "email") {
          control.setValue("steps", "email-otp");
        } else {
          control.setValue("steps", "otp");
        }
        return;
      }
      case "login-code": {
        control.setValue("steps", "login-phone");
        return;
      }
      case "login-email-code": {
        control.setValue("steps", "login-email");
        return;
      }
      case "login-phone":
      case "login-email":
      case "login-username-password": {
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
