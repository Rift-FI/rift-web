import { BASEURL } from "./config";

export const checkServerStatus = async (): Promise<{ status: number }> => {
  const res = await fetch(BASEURL, {
    method: "GET",
  });

  return { status: res?.status };
};
