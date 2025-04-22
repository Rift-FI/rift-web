import { BASEURL, ENDPOINTS } from "./config";

// HTTP
export const signupUser = async (
  tgUsername: string,
  deviceToken: string,
  deviceName: string,
  otpCode: string,
  phoneNumber: string,
  referrer: string
): Promise<{ status: number }> => {
  let URL = BASEURL + ENDPOINTS.signup;

  const res = await fetch(URL, {
    method: "POST",
    body: JSON.stringify({
      telegramId: tgUsername,
      password: tgUsername,
      deviceToken,
      deviceName,
      otpCode,
      phoneNumber,
      referrer,
    }),
    headers: { "Content-Type": "application/json" },
  });

  return { status: res?.status };
};

export const sendOtp = async (phone: string): Promise<{ status: number }> => {
  const URL = BASEURL + ENDPOINTS.sendotp;

  const response = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone,
    }),
  });

  return { status: response?.status };
};

export const verifyOtp = async (code: string, phone: string) => {
  const URL = BASEURL + ENDPOINTS.verifyotp;
  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        phone,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to verify OTP:", response.status, errorData);
      throw new Error(errorData.message || "Invalid verification code");
    }

    return response;
  } catch (e) {
    console.error("Verify OTP error:", e);
    throw Error("Failed to verify OTP. Please check your code and try again.");
  }
};
