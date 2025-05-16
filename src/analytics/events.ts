import posthog from "posthog-js";
import { POSTHOG_HOST, POSTHOG_KEY } from "../constants";
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
  | "PAGE_VISIT";

type BASE_EVENT_DETAILS = {
  telegram_id: string;
};

export const authenticateUser = (telegram_id?: string, username?: string) => {
  try {
    posthog.identify(telegram_id ?? "UNKNOWN USER", {
      username
    })

  } catch (_e) {
    // silent fail
  }
}

export const analyticsLog = (
  event: ANALYTIC_EVENT_TYPES,
  data: BASE_EVENT_DETAILS
) => {
  try {

    posthog.capture(event, data);
  } catch (_e) {
    // silent fail
  }
};
