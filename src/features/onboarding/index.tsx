import { useCallback } from "react";
import OnboardingContextProvider, { useFlow } from "./context";
import Start from "./steps/start";
import Identifier from "./steps/identifier";
import Code from "./steps/code";
import Created from "./steps/created";
import AuthCheck from "./steps/auth-check";

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
  console.log("Steps changes", CURRENT_STEP);

  const RenderOnboardingStep = useCallback(() => {
    switch (CURRENT_STEP) {
      case "start": {
        return <Start />;
        break;
      }
      case "phone": {
        return <Identifier />;
        break;
      }
      case "otp": {
        return <Code />;
        break;
      }
      case "created": {
        return <Created />;
        break;
      }
      case "login-phone": {
        return <Identifier flow="login" />;
      }
      case "login-code": {
        return <Code flow="login" />;
      }
      case "auth-check": {
        return <AuthCheck />;
      }
    }
  }, [CURRENT_STEP]);
  return (
    <div className="flex flex-col w-full h-screen bg-app-background">
      <RenderOnboardingStep />
    </div>
  );
}
