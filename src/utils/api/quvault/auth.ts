import { QUVAULT_BASEURL, QUVAULT_ENDPOINTS } from "../config";

export type quvaultuser = {
  id: string;
  email: string;
  name: string;
  role: string;
  wallet_address: string;
  token: string;
};

export const signupQuvaultUser = async (
  name: string,
  email: string,
  password: string
): Promise<quvaultuser> => {
  let URL = QUVAULT_BASEURL + QUVAULT_ENDPOINTS.signup;
  if (import.meta.env.MODE == "development" || import.meta.env.VITE_APP_ENV == "preview") return {
    email: "test@test.com",
    id: "1234",
    name: "tester",
    role: "user",
    token: "hello world",
    wallet_address: "0xtester"
  };

  const res = await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
    headers: { "Content-Type": "application/json" },
  });

  return res.json();
};

export const signinQuvaultUser = async (
  email: string,
  password: string
): Promise<quvaultuser> => {
  if (import.meta.env.MODE == "development" || import.meta.env.VITE_APP_ENV == "preview") return {
    email: "test@test.com",
    id: "1234",
    name: "tester",
    role: "user",
    token: "hello world",
    wallet_address: "0xtester"
  };
  let URL = QUVAULT_BASEURL + QUVAULT_ENDPOINTS.signin;

  const res = await fetch(URL, {
    method: "POST",
    body: JSON.stringify({ email, password }),
    headers: { "Content-Type": "application/json" },
  });

  return res.json();
};

export const quvaultUserInfo = async (): Promise<quvaultuser> => {
  if (import.meta.env.MODE == "development" || import.meta.env.VITE_APP_ENV == "preview") return {
    email: "test@test.com",
    id: "1234",
    name: "tester",
    role: "user",
    token: "hello world",
    wallet_address: "0xtester"
  };
  let URL = QUVAULT_BASEURL + QUVAULT_ENDPOINTS.signup;
  let quvaultToken = localStorage.getItem("quvaulttoken");

  const res = await fetch(URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${quvaultToken}`,
    },
  });

  return res.json();
};
