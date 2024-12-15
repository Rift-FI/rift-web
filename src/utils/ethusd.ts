type ethUSD = {
  ethereum: {
    usd: number;
  };
};

export const getEthUsdVal = async (
  ethVal?: number
): Promise<{ ethInUSD: number; success: boolean }> => {
  const APIURL =
    "https://pro-api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&x_cg_pro_api_key=CG-Whw1meTdSTTT7CSpGZbaB3Yi";

  let res: Response = await fetch(APIURL, {
    method: "GET",

    headers: {
      accept: "application/json",
    },
  });
  let data: ethUSD = await res.json();
  let ethToUsd: number = data?.ethereum?.usd;

  return { ethInUSD: (ethVal as number) * ethToUsd, success: res.ok };
};
