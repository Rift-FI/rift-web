import { BASEURL, ENDPOINTS } from "./config";

export type keyType = {
  name: string;
  type: string; // "own" | "foreign";
  value: string;
  owner: string;
  token:string;
  url:string;
};

export type getkeysType = {
  keys: string[];
};

export const fetchMyKeys = async (
  accessToken: string
): Promise<{ isOk: boolean; keys: getkeysType }> => {
  let URL = BASEURL + ENDPOINTS.getkeys;

  let res: Response = await fetch(URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  let data: getkeysType = await res.json();

  return { isOk: res.ok, keys: data };
};

// keytpe -> own
// keyowner -> self
export const importKey = async (
  accessToken: string,
  keyname: string,
  keytype: string,
  keyval: string,
  keyowner: string
): Promise<{ isOk: boolean }> => {
  const URL = BASEURL + ENDPOINTS.importkey;

  const keyObject = JSON.stringify({
    name: keyname,
    type: keytype,
    value: keyval,
    owner: keyowner,
  });

  let res: Response = await fetch(URL, {
    method: "POST",
    body: JSON.stringify({
      key: keyObject,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return { isOk: res.ok };
};

// keytype -> foreign
// keyowner -> self
export const ShareKeyWithOtherUser = async (
  accessToken: string,
  keyname: string,
  keytype: string,
  keyval: string,
  keyowner: string,
  keytargetuser: string
): Promise<{ isOk: boolean }> => {
  const URL = BASEURL + ENDPOINTS.sharekey;

  const keyObject = JSON.stringify({
    name: keyname,
    type: keytype,
    value: keyval,
    owner: keyowner,
  });

  let res: Response = await fetch(URL, {
    method: "POST",
    body: JSON.stringify({
      key: keyObject,
      email: keytargetuser,
      time: "60s"
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return { isOk: res.ok };
};
