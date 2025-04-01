import { BASEURL, ENDPOINTS } from "./config";

// HTTP
export const signupUser = async (
  tgUsername: string,
  deviceToken: string,
  deviceName: string,
  otpCode: string
) => {
  let URL = BASEURL + ENDPOINTS.signup;

  await fetch(URL, {
    method: "POST",
    body: JSON.stringify({
      telegramId: tgUsername,
      password: tgUsername,
      deviceToken,
      deviceName,
      otpCode,
    }),
    headers: { "Content-Type": "application/json" },
  });
};

export const sendOtp = async (phone: string) => {
  const URL = BASEURL + ENDPOINTS.sendotp;
  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Failed to send OTP:", response.status, errorData);
      throw new Error(errorData.message || "Failed to send OTP");
    }

    return response;
  } catch (e) {
    console.error("Send OTP error:", e);
    throw Error(
      "Failed to send OTP. Please check your connection and try again."
    );
  }
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
