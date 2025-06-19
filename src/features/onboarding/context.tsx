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
  "otp",
  "created",
  "login-phone",
  "login-code",
  "auth-check",
]);

const onboardingSchema = z.object({
  steps: stepsSchema,
  identifier: z.string(),
  code: z.string(),
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
    switch (CURRENT) {
      case "start": {
        control.setValue("steps", "phone");
        return;
      }
      case "phone": {
        control.setValue("steps", "otp");
        return;
      }
      case "otp": {
        control.setValue("steps", "created");
        return;
      }
      case "login-phone": {
        control.setValue("steps", "login-code");
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
    switch (CURRENT) {
      case "phone": {
        control.setValue("steps", "start");
        return;
      }
      case "otp": {
        control.setValue("steps", "phone");
        return;
      }
      case "created": {
        control.setValue("steps", "otp");
        return;
      }
      case "login-code": {
        control.setValue("steps", "login-phone");
        return;
      }
      case "login-phone": {
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
