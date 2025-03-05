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
