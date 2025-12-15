/**
 * Type definitions for Smile ID Web Integration
 */

declare global {
  interface Window {
    SmileIdentity: (config: SmileIDConfig) => void;
  }
}

interface SmileIDConfig {
  token: string;
  product:
    | "biometric_kyc"
    | "doc_verification"
    | "smartselfie"
    | "authentication"
    | "basic_kyc"
    | "enhanced_kyc"
    | "enhanced_document_verification"
    | "e_signature";
  callback_url: string;
  environment: "sandbox" | "live";
  partner_details: {
    partner_id: string;
    name: string;
    logo_url: string;
    policy_url: string;
    theme_color?: string;
  };
  partner_params?: {
    [key: string]: any;
    sandbox_result?: "0" | "1" | "2";
  };
  id_selection?: {
    [countryCode: string]: string[];
  };
  consent_required?: {
    [countryCode: string]: string[];
  };
  document_capture_modes?: ("camera" | "upload")[];
  allow_agent_mode?: boolean;
  onSuccess?: (data: any) => void;
  onClose?: () => void;
  onError?: (error: { message: string; data?: any }) => void;
}

export {};
