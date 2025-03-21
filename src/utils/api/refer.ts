import { BASEURL, ENDPOINTS } from "./config";

interface ReferralLinkResponse {
  referral_link: string;
  code: string;
  message: string;
}

export const createReferralLink = async (): Promise<ReferralLinkResponse> => {
  const response = await fetch(`${BASEURL}${ENDPOINTS.createReferralLink}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("spheretoken")}`,
    },
  });

  const referralLink = await response.json();
  return referralLink;
};
