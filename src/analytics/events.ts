import posthog from "posthog-js";
import { POSTHOG_HOST, POSTHOG_KEY } from "../constants";
posthog.init(POSTHOG_KEY, {
  api_host: POSTHOG_HOST,
    person_profiles: "always",
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

export const analyticsLog = (
  event: ANALYTIC_EVENT_TYPES,
  data: BASE_EVENT_DETAILS
) => {
  posthog.capture(event, data);
};
