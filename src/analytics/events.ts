import posthog from "posthog-js";
import { POSTHOG_HOST, POSTHOG_KEY } from "../constants";

const ENVIRONMENT = import.meta.env.MODE;

posthog.init(POSTHOG_KEY, {
  api_host: POSTHOG_HOST,
  person_profiles: "identified_only",
});
export type ANALYTIC_EVENT_TYPES =
  | "SIGN_UP"
  | "SIGN_IN"
  | "APP_LAUNCH"
  | "COPY_REFFERAL"
  | "OPEN_INTEGRATION"
  | "DEPOSIT"
  | "SEND"
  | "PAGE_VISIT"
  | "WALLET_CREATED";

type BASE_EVENT_DETAILS = {
  telegram_id: string;
};

export const authenticateUser = (telegram_id?: string, username?: string) => {
  if (ENVIRONMENT == "development") return;
  try {
    posthog.identify(telegram_id ?? "UNKNOWN USER", {
      username,
    });
  } catch {
    // silent fail
  }
};

export const analyticsLog = (
  event: ANALYTIC_EVENT_TYPES,
  data: BASE_EVENT_DETAILS,
) => {
  if (ENVIRONMENT == "development") return;
  try {
    posthog.capture(event, data);
  } catch {
    // silent fail
  }
};

export const submitRating = (telegram_id?: string, rating?: number) => {
  if (ENVIRONMENT == "development") return;

  try {
    posthog.capture("RATING_SUBMITTED", {
      telegram_id: telegram_id ?? "UNKNOWN USER",
      rating,
    });
  } catch {
    //silent fail
  }
};

export const submitFeedback = (telegram_id?: string, feedback?: string) => {
  if (ENVIRONMENT == "development") return;

  try {
    posthog.capture("FEEDBACK_SUBMITTED", {
      telegram_id: telegram_id ?? "UNKNOWN USER",
      feedback,
    });
  } catch {
    //silent fail
  }
};
