import { BASEURL, ENDPOINTS } from "./config";

type stakinginfo = {
  success: boolean;
  data: {
    totalStaked: string;
    treasuryValue: string;
    tokenName: string;
    tokenSymbol: string;
    treasuryAddress: string;
  };
};

type stakingbalance = {
  success: boolean;
  data: {
    stakedBalance: number;
    lstBalance: number;
    address: string;
  };
};

export const getStakingInfo = async (): Promise<stakinginfo> => {
  const URL = BASEURL + ENDPOINTS.stakinginfo;

  const res = await fetch(URL, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  return res.json();
};

export const stakeLST = async (amount: number) => {
  const URL = BASEURL + ENDPOINTS.stakelst;
  const authtoken: string | null = localStorage.getItem("spheretoken");

  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authtoken as string}`,
    },
    body: JSON.stringify({ amount }),
  });

  return res.json();
};

export const getStakeingBalance = async (): Promise<stakingbalance> => {
  let ethaddress = localStorage.getItem("ethaddress");

  const URL = BASEURL + ENDPOINTS.stakebalance + ethaddress;

  const res = await fetch(URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return res.json();
};
