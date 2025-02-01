import { BASEURL, ENDPOINTS } from "./config";

export const createReferralLink = async (): Promise<string> => {
  const response = await fetch(`${BASEURL}${ENDPOINTS.createReferralLink}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const referralLink = await response.json();
  return referralLink;
};

export const earnFromReferral = async (code: string) => {
  await fetch(`${BASEURL}${ENDPOINTS.incentivize}?code=${code}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const rewardNewUser = async () => {
  const URL = BASEURL + ENDPOINTS.rewardnewuser;
  const authToken = localStorage.getItem("token");

  await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });
};
