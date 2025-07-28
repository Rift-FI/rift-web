import { useCallback } from "react";
import OnboardingContextProvider, { useFlow } from "./context";
import Start from "./steps/start";
import Identifier from "./steps/identifier";
import Email from "./steps/email";
import UsernamePassword from "./steps/username-password";
import Code from "./steps/code";
import Created from "./steps/created";
import AuthCheck from "./steps/auth-check";
import ForgotPassword from "./steps/forgot-password";

export default function Onboarding() {
  return (
    <OnboardingContextProvider>
      <_Onboarding />
    </OnboardingContextProvider>
  );
}

export function _Onboarding() {
  const flow = useFlow();
  const CURRENT_STEP = flow.currentStep;

  const RenderOnboardingStep = useCallback(() => {
    switch (CURRENT_STEP) {
      case "start": {
        return <Start />;
      }
      case "phone": {
        return <Identifier />;
      }
      case "email": {
        return <Email />;
      }
      case "username-password": {
        return <UsernamePassword />;
      }
      case "otp": {
        return <Code />;
      }
      case "created": {
        return <Created />;
        break;
      }
      case "login-phone": {
        return <Identifier flow="login" />;
      }
      case "login-email": {
        return <Email flow="login" />;
      }
      case "login-username-password": {
        return <UsernamePassword flow="login" />;
      }
      case "login-code": {
        return <Code flow="login" />;
      }
      case "auth-check": {
        return <AuthCheck />;
      }
      case "forgot-password": {
        return <ForgotPassword />;
      }
    }
  }, [CURRENT_STEP]);

  return (
    <div className="flex flex-col w-full h-screen bg-app-background">
      <RenderOnboardingStep />
    </div>
  );
}
