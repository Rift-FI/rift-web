import { POLYMARKET_BASE_URL, POLYMARKET_ENDPOINTS } from "./config";

type signupres = {
  id: string;
  token: string;
};

export const registerWithKey = async (
  key: string,
  external_identifier: string
): Promise<signupres> => {
  const URL = POLYMARKET_BASE_URL + POLYMARKET_ENDPOINTS.register;

  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key,
      external_identifier,
    }),
  });

  return res.json();
};

export const signinWithIdentifier = async (): Promise<
  Exclude<signupres, "id">
> => {
  const URL = POLYMARKET_BASE_URL + POLYMARKET_ENDPOINTS.signin;

  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_identifier: "glenn",
    }),
  });

  return res.json();
};
