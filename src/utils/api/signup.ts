import { BASEURL, ENDPOINTS } from "./config";

// HTTP
export const signupUser = async (tgUsername: string) => {
  let URL = BASEURL + ENDPOINTS.signup;

  await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ email: tgUsername, password: tgUsername }),
    headers: { "Content-Type": "application/json" },
  });
};
