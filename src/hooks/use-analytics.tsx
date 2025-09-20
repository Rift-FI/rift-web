import posthog from "posthog-js";
import { usePlatformDetection } from "@/utils/platform";
import useWalletAuth from "./wallet/use-wallet-auth";

type ANALYTIC_EVENT_TYPES =
  | "SIGN_UP"
  | "SIGN_IN"
  | "APP_LAUNCH"
  | "COPY_ADDRESS"
  | "OPEN_INTEGRATION"
  | "DEPOSIT"
  | "SEND"
  | "PAGE_VISIT_HOME"
  | "PAGE_VISIT_SWAP"
  | "PAGE_VISIT_ACTIVITY"
  | "PAGE_VISIT_PROFILE"
  | "PAGE_VISIT_AGENT"
  | "PAGE_VISIT_AGENT"
  | "WALLET_CREATED"
  | "PAYMENT_LINK_CREATED"
  | "PAYMENT_REQUEST_CREATED"
  | "PAYMENT_LINK_CLAIMED"
  | "PAYMENT_REQUEST_PAID"
  | "USE_AGENT_ACTION"
  | "SEND_PAYMENT_REQUSTLINK"
  | "REQUEST_EMAIL_OTP_FAILED"
  | "REQUEST_PHONE_OTP_FAILED"
  | "WITHDRAW_BUTTON_CLICKED"
  | "REQUEST_BUTTON_CLICKED"
  | "PAY_BUTTON_CLICKED"
  | "VIEW_ON_BASESCAN";

const analyticsLog = (event: ANALYTIC_EVENT_TYPES) => {
  try {
    posthog.capture(event);
  } catch (error) {
    console.error("Error logging analytics event", event, error);
  }
};

export default function useAnalaytics() {
  const { isTelegram, telegramUser } = usePlatformDetection();
  const { userQuery } = useWalletAuth();

  const identifier = isTelegram
    ? telegramUser?.id.toString()
    : userQuery?.data?.externalId ??
      userQuery?.data?.email ??
      "PHONE-AUTH-USER";

  const logEvent = (event: ANALYTIC_EVENT_TYPES) => {
    posthog.identify(identifier);
    analyticsLog(event);
  };

  return {
    logEvent,
  };
}
