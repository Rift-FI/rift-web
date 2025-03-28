import { BASEURL, ENDPOINTS } from "./config";

type stakinginfo = {
  success: true;
  data: {
    totalStaked: string;
    treasuryValue: string;
    tokenName: string;
    tokenSymbol: string;
    treasuryAddress: string;
    withdrawalCooldown: string;
  };
};

type stakingbalance = {
  success: boolean;
  data: {
    isStaker: boolean;
    stakerIndex: string;
    lstBalance: string;
    address: string;
    withdrawalRequest: {
      amount: string;
      requestTime: string;
      claimed: boolean;
      canClaim: boolean;
      cooldownRemaining: string;
    };
  };
};

type unstakeres = {
  success: boolean;
  message: string;
  data: {
    transactionHash: string;
    amountUnstaked: string;
    blockNumber: number;
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

export const stakeLST = async (amount: number, intent: string) => {
  const URL = BASEURL + ENDPOINTS.stakelst;
  const authtoken: string | null = localStorage.getItem("spheretoken");

  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authtoken as string}`,
    },
    body: JSON.stringify({ amount, intent }),
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

export const unstakeLST = async (lstAmount: string): Promise<unstakeres> => {
  const URL = BASEURL + ENDPOINTS.unstakelst;

  const res = await fetch(URL, {
    method: "POST",
    body: JSON.stringify({
      lstAmount,
    }),
  });

  return res.json();
};
