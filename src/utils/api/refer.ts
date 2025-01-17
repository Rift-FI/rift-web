import { BASEURL, ENDPOINTS } from "./config";

export const createReferralLink = async (): Promise<string | void> => {
  try {
    const response = await fetch(`${BASEURL}${ENDPOINTS.createReferralLink}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      const referralLink = await response.json();
      return referralLink;
    } else if (response.status === 401) {
      throw new Error("Unauthorized. Please log in again.");
    } else {
      throw new Error("Failed to create referral link.");
    }
  } catch (error) {
    console.error("Error creating referral link:", error);
  }
};

export const earnFromReferral = async (
  code: string
): Promise<{ earnOk: boolean }> => {
  const response = await fetch(
    `${BASEURL}${ENDPOINTS.incentivize}?code=${code}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return { earnOk: response.ok };
};

export const rewardNewUser = async (): Promise<{ isOk: boolean }> => {
  const URL = BASEURL + ENDPOINTS.rewardnewuser;
  const authToken = localStorage.getItem("token");

  const response = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });

  return { isOk: response?.ok };
};
