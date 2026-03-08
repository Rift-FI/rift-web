import posthog from "posthog-js";
import { usePlatformDetection } from "@/utils/platform";
import useWalletAuth from "./wallet/use-wallet-auth";
import useKYCStatus from "./data/use-kyc-status";
import useCountryDetection from "./data/use-country-detection";
import useUser from "./data/use-user";
import useBaseUSDCBalance from "./data/use-base-usdc-balance";

type ANALYTIC_EVENT_TYPES =
  // Auth & Onboarding
  | "SIGN_UP"
  | "SIGN_IN"
  | "SIGN_OUT"
  | "APP_LAUNCH"
  | "WALLET_CREATED"
  | "ONBOARDING_COMPLETED"
  | "ONBOARDING_SKIPPED"
  
  // Navigation & Pages
  | "PAGE_VISIT_HOME"
  | "PAGE_VISIT_WALLET"
  | "PAGE_VISIT_SWAP"
  | "PAGE_VISIT_ACTIVITY"
  | "PAGE_VISIT_PROFILE"
  | "PAGE_VISIT_AGENT"
  | "PAGE_VISIT_INVEST"
  | "PAGE_VISIT_VAULT"
  | "PAGE_VISIT_KYC"
  | "PAGE_VISIT_WEEKLY_POOL"
  
  // Money Flows - Deposits & Onramps
  | "DEPOSIT"
  | "DEPOSIT_INITIATED"
  | "DEPOSIT_COMPLETED"
  | "DEPOSIT_FAILED"
  | "ONRAMP_QUOTE_VIEWED"
  | "ONRAMP_INITIATED"
  | "ONRAMP_COMPLETED"
  | "ONRAMP_FAILED"
  
  // Money Flows - Withdrawals & Offramps
  | "WITHDRAW_INITIATED"
  | "WITHDRAW_COMPLETED"
  | "WITHDRAW_FAILED"
  | "WITHDRAW_BUTTON_CLICKED"
  
  // Money Flows - Sends & Transfers
  | "SEND"
  | "SEND_INITIATED"
  | "SEND_COMPLETED"
  | "SEND_FAILED"
  | "SEND_BUTTON_CLICKED"
  
  // Payment Links & Requests
  | "PAYMENT_LINK_CREATED"
  | "PAYMENT_REQUEST_CREATED"
  | "PAYMENT_LINK_CLAIMED"
  | "PAYMENT_REQUEST_PAID"
  | "PAYMENT_LINK_COPIED"
  | "PAYMENT_REQUEST_COPIED"
  | "SEND_PAYMENT_REQUSTLINK"
  | "REQUEST_BUTTON_CLICKED"
  | "TOPUP_BUTTON_CLICKED"
  | "PAY_BUTTON_CLICKED"
  
  // Vault & Investments
  | "VAULT_PAGE_VISIT"
  | "VAULT_CARD_CLICKED"
  | "VAULT_DEPOSIT_INITIATED"
  | "VAULT_DEPOSIT_COMPLETED"
  | "VAULT_DEPOSIT_FAILED"
  | "VAULT_WITHDRAW_INITIATED"
  | "VAULT_WITHDRAW_COMPLETED"
  | "VAULT_WITHDRAW_FAILED"
  | "VAULT_REWARDS_CLAIMED"
  | "VAULT_EXPLANATION_EXPANDED"
  
  // KYC
  | "KYC_FLOW_STARTED"
  | "KYC_STEP_STARTED"
  | "KYC_COUNTRY_SELECTED"
  | "KYC_VERIFICATION_SUCCESS"
  | "KYC_VERIFICATION_ERROR"
  | "KYC_SKIPPED"
  | "KYC_DEVICE_OVERRIDE"
  | "KYC_BUTTON_CLICKED"
  
  // Receive & Address
  | "COPY_ADDRESS"
  | "VIEW_ON_BASESCAN"
  | "RECEIVE_ADDRESS_VIEWED"
  
  // Swap
  | "SWAP_INITIATED"
  | "SWAP_COMPLETED"
  | "SWAP_FAILED"
  
  // Agent & AI
  | "USE_AGENT_ACTION"
  | "AGENT_QUERY_SENT"
  | "AGENT_RESPONSE_RECEIVED"
  
  // Notifications
  | "NOTIFICATIONS_ENABLED_ONBOARDING"
  | "NOTIFICATIONS_SKIPPED_ONBOARDING"
  | "NOTIFICATIONS_ENABLED"
  | "NOTIFICATIONS_DISABLED"
  | "NOTIFICATION_RECEIVED"
  | "NOTIFICATION_CLICKED"
  
  // Settings & UX
  | "BALANCE_VISIBILITY_TOGGLED"
  | "CURRENCY_CHANGED"
  | "ADVANCED_MODE_TOGGLED"
  | "PWA_INSTALL_PROMPTED"
  | "PWA_INSTALL_ACCEPTED"
  | "PWA_INSTALL_DISMISSED"
  | "APP_REFRESHED"
  | "TUTORIAL_STARTED"
  | "TUTORIAL_COMPLETED"
  | "TUTORIAL_SKIPPED"
  
  // Referrals
  | "REFERRAL_LINK_COPIED"
  | "REFERRAL_LINK_SHARED"
  | "REFERRAL_CODE_VIEWED"
  | "REFERRAL_FEE_CLAIMED"
  | "PAGE_VISIT_PERPETUAL_EARNINGS"
  
  // Errors & OTP
  | "REQUEST_EMAIL_OTP_FAILED"
  | "REQUEST_PHONE_OTP_FAILED"
  | "OTP_VERIFICATION_FAILED"
  | "OTP_VERIFICATION_SUCCESS"
  
  // Feature Cards
  | "WALLET_CARD_CLICKED"
  | "EARN_CARD_CLICKED"
  | "SEND_CRYPTO_CLICKED"
  | "RECEIVE_CRYPTO_CLICKED"
  | "BUY_CRYPTO_CLICKED"

  // Utilities
  | "UTILITIES_BUTTON_CLICKED"
  | "OPEN_INTEGRATION"
  | "HISTORY_TAB_CHANGED"
  | "VIEW_ALL_CLICKED"

  // Onboarding CTA
  | "ONBOARDING_BUY_USDC_CLICKED"
  | "ONBOARDING_SKIP_TO_HOME";

const analyticsLog = (
  event: ANALYTIC_EVENT_TYPES,
  properties?: Record<string, any>
) => {
  try {
    posthog.capture(event, properties);
  } catch (error) {
    console.error("PostHog capture error:", error);
  }
};

// Set person properties on PostHog
const setPersonProperties = (properties: Record<string, any>) => {
  try {
    posthog.people.set(properties);
  } catch (error) {
    console.error("PostHog set person properties error:", error);
  }
};

export default function useAnalaytics() {
  const { isTelegram, telegramUser } = usePlatformDetection();
  const { userQuery } = useWalletAuth();
  const { data: user } = useUser();
  const { isKYCVerified, isUnderReview, status: kycStatus } = useKYCStatus();
  const { data: countryInfo } = useCountryDetection();
  const { data: balanceData } = useBaseUSDCBalance();

  // Get user identifier
  const identifier = isTelegram
    ? telegramUser?.id.toString()
    : userQuery?.data?.externalId ??
      userQuery?.data?.email ??
      user?.email ??
      user?.phoneNumber ??
      "PHONE-AUTH-USER";

  // Build automatic context properties
  const getContextProperties = (): Record<string, any> => {
    const context: Record<string, any> = {
      // Platform
      is_telegram: isTelegram,
      platform: isTelegram ? "telegram" : "web",
      
      // User
      user_id: identifier,
      has_user_data: !!user,
      
      // KYC
      kyc_verified: isKYCVerified,
      kyc_under_review: isUnderReview,
      kyc_status: kycStatus || "not_started",
      
      // Country & Currency
      country: countryInfo?.country || null,
      country_name: countryInfo?.countryName || null,
      currency: countryInfo?.currency || "USD",
      
      // Balance (if available)
      has_balance: !!balanceData,
      balance_usdc: balanceData?.usdcAmount || 0,
      balance_local: balanceData?.localAmount || 0,
      
      // Device
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
      user_agent: navigator.userAgent,
      
      // Timestamp
      timestamp: new Date().toISOString(),
    };

    // Add user properties if available
    if (user) {
      context.user_email = user.email || null;
      context.user_phone = user.phoneNumber || null;
      context.user_external_id = user.externalId || null;
      context.has_payment_account = !!(user.paymentAccount || user.payment_account);
    }

    return context;
  };

  // Identify user and set person properties
  const identifyUser = () => {
    if (!identifier || identifier === "PHONE-AUTH-USER") return;

    try {
      posthog.identify(identifier, {
        // User properties
        email: user?.email || userQuery?.data?.email || null,
        phone: user?.phoneNumber || userQuery?.data?.phoneNumber || null,
        external_id: user?.externalId || userQuery?.data?.externalId || null,
        telegram_id: isTelegram ? telegramUser?.id?.toString() : null,
        
        // KYC properties
        kyc_verified: isKYCVerified,
        kyc_status: kycStatus || "not_started",
        kyc_under_review: isUnderReview,
        
        // Location properties
        country: countryInfo?.country || null,
        country_name: countryInfo?.countryName || null,
        currency: countryInfo?.currency || "USD",
        
        // Platform
        platform: isTelegram ? "telegram" : "web",
        is_telegram: isTelegram,
        
        // Feature flags (what user has done)
        has_deposited: false, // Will be updated when deposit happens
        has_withdrawn: false, // Will be updated when withdrawal happens
        has_used_vault: false, // Will be updated when vault is used
        has_created_payment_request: false, // Will be updated when request is created
        has_verified_kyc: isKYCVerified,
        
        // Timestamps
        first_seen: new Date().toISOString(),
      });

      // Set person properties
      setPersonProperties({
        kyc_verified: isKYCVerified,
        kyc_status: kycStatus || "not_started",
        country: countryInfo?.country || null,
        currency: countryInfo?.currency || "USD",
        platform: isTelegram ? "telegram" : "web",
      });
    } catch (error) {
      console.error("PostHog identify error:", error);
    }
  };

  // Enhanced logEvent with automatic context
  const logEvent = (
    event: ANALYTIC_EVENT_TYPES,
    properties?: Record<string, any>
  ) => {
    // Identify user first
    identifyUser();

    // Merge custom properties with automatic context
    const enrichedProperties = {
      ...getContextProperties(),
      ...properties,
    };

    analyticsLog(event, enrichedProperties);
  };

  // Helper to update person properties (for feature flags)
  const updatePersonProperties = (properties: Record<string, any>) => {
    identifyUser();
    setPersonProperties(properties);
  };

  return {
    logEvent,
    identifyUser,
    updatePersonProperties,
    getContextProperties,
  };
}
