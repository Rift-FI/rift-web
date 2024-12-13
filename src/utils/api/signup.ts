import { BASEURL, ENDPOINTS } from "./config";

// HTTP
export const signupUser = async (
  usrEmail: string,
  usrPassword: string
): Promise<{ signupSuccess: boolean }> => {
  let URL = BASEURL + ENDPOINTS.signup;

  let res: Response = await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ email: usrEmail, password: usrPassword }),
    headers: { "Content-Type": "application/json" },
  });

  if (res.status == 200) {
    return { signupSuccess: true };
  } else {
    return { signupSuccess: false };
  }
};
