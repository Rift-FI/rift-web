import { POLYMARKET_BASE_URL, POLYMARKET_ENDPOINTS } from "./config";

type signupres = {
  id: string;
  token: string;
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
