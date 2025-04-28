import { BASEURL } from "../api/config";
import { POLYMARKET_ENDPOINTS } from "./config";

type signupres = {
  id: string;
  token: string;
};

export const registerWithKey = async (
  key: string,
  external_identifier: string
): Promise<{ data: signupres }> => {
  const URL = BASEURL + POLYMARKET_ENDPOINTS.register;
  const polymarkettoken = localStorage.getItem("polymarkettoken");

  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${polymarkettoken}`,
    },
    body: JSON.stringify({
      key,
      external_identifier,
    }),
  });

  return res.json();
};

export const signinWithIdentifier = async (
  external_identifier: string
): Promise<{ data: Exclude<signupres, "id"> }> => {
  const URL = BASEURL + POLYMARKET_ENDPOINTS.signin;
  const polymarkettoken = localStorage.getItem("polymarkettoken");

  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${polymarkettoken}`,
    },
    body: JSON.stringify({
      external_identifier,
    }),
  });

  return res.json();
};
