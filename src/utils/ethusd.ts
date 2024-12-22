type btcUSD = {
  bitcoin: {
    usd: number;
  };
};

type ethUSD = {
  ethereum: {
    usd: number;
  };
};

export const getBtcUsdVal = async (btcQty: number) => {
  const APIURL =
    "https://pro-api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&x_cg_pro_api_key=CG-Whw1meTdSTTT7CSpGZbaB3Yi";

  let res: Response = await fetch(APIURL, {
    method: "GET",

    headers: {
      accept: "application/json",
    },
  });
  let data: btcUSD = await res.json();

  let btcToUsd: number = data?.bitcoin?.usd;

  return {
    btcQtyInUSD: (btcQty as number) * btcToUsd,
    btcValue: data?.bitcoin?.usd,
    success: res.ok,
  };
};

export const getEthUsdVal = async (
  ethVal?: number
): Promise<{ ethInUSD: number; ethValue: number; success: boolean }> => {
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

  return {
    ethInUSD: (ethVal as number) * ethToUsd,
    ethValue: data?.ethereum?.usd,
    success: res.ok,
  };
};
