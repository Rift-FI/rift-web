import { BASEURL, ENDPOINTS } from "./config";

export const createReferralLink = async (
  type: string | undefined
): Promise<string> => {
  const response = await fetch(`${BASEURL}${ENDPOINTS.createReferralLink}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const referralLink = await response.json();
  return `${referralLink}%26type=${type}`;
};

export const earnFromReferral = async (code: string, referaltype: string) => {
  const authToken = localStorage.getItem("token");

  await fetch(
    `${BASEURL}${ENDPOINTS.incentivize}?code=${code}&type=${referaltype}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    }
  );
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
