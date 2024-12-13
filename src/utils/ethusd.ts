type ethUSD = {
  ethereum: {
    usd: number;
  };
};

export const getEthUsdVal = async (
  ethVal?: number
): Promise<{ ethInUSD: number; success: boolean }> => {
  const APIURL =
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";

  let res: Response = await fetch(APIURL, { method: "GET" });
  let data: ethUSD = await res.json();
  let ethToUsd: number = data?.ethereum?.usd;

  return { ethInUSD: (ethVal as number) * ethToUsd, success: res.ok };
};
