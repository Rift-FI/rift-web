export interface Country {
  code: string;
  name: string;
  flag: string;
}

export interface KYCData {
  nationality?: string;
  images?: any[];
  smileJobId?: string;
  verified?: boolean;
}

export interface SmileIDConfig {
  token: string;
  product: "biometric_kyc" | "doc_verification" | "smartselfie";
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
  };
  onSuccess?: () => void;
  onClose?: () => void;
  onError?: (error: { message: string; data?: any }) => void;
}
