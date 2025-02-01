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

export const getBtcUsdVal = async (): Promise<number> => {
  const APIURL =
    "https://pro-api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&x_cg_pro_api_key=CG-Whw1meTdSTTT7CSpGZbaB3Yi";

  let res: Response = await fetch(APIURL, {
    method: "GET",

    headers: {
      accept: "application/json",
    },
  });
  let data: btcUSD = await res.json();

  return data?.bitcoin?.usd;
};

export const getEthUsdVal = async (): Promise<number> => {
  const APIURL =
    "https://pro-api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&x_cg_pro_api_key=CG-Whw1meTdSTTT7CSpGZbaB3Yi";

  let res: Response = await fetch(APIURL, {
    method: "GET",

    headers: {
      accept: "application/json",
    },
  });
  let data: ethUSD = await res.json();
  return data?.ethereum?.usd;
};
