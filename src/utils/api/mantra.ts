type mantraUSD = {
  [key: string]: {
    usd: number;
  };
};

export const getMantraUsdVal = async (
  mantraQty: number
): Promise<{
  mantraQtyUsd: number;
  mantraInUSD: number;
  success: boolean;
}> => {
  const APIURL =
    "https://pro-api.coingecko.com/api/v3/simple/price?ids=mantra-dao&vs_currencies=usd";

  let res: Response = await fetch(APIURL, {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-cg-pro-api-key": "CG-Whw1meTdSTTT7CSpGZbaB3Yi",
    },
  });
  let data: mantraUSD = await res.json();
  let mantraUsd = data["mantra-dao"]?.usd;

  return {
    mantraQtyUsd: mantraQty * mantraUsd,
    mantraInUSD: data["mantra-dao"]?.usd,
    success: res.ok,
  };
};
