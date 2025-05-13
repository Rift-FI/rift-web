import { POLYMARKET_BASE_URL, POLYMARKET_ENDPOINTS } from "./config";

type signupres = {
  id: string;
  token: string;
};

export const registerWithIdentifier = async (
  identifier: string
): Promise<Exclude<signupres, "id">> => {
  const URL = POLYMARKET_BASE_URL + POLYMARKET_ENDPOINTS.register;

  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_identifier: identifier,
    }),
  });

  return res.json();
};

export const signinWithIdentifier = async (
  identifier: string
): Promise<Exclude<signupres, "id">> => {
  const URL = POLYMARKET_BASE_URL + POLYMARKET_ENDPOINTS.signin;

  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_identifier: identifier,
    }),
  });

  return res.json();
};
