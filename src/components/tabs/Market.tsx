import { JSX, useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { useSnackbar } from "../../hooks/snackbar";
import { coinType, fetchCoins } from "../../utils/api/market";
import { Loading } from "../../assets/animations";
import "../../styles/components/tabs/markettab.css";

export const MarketTab = (): JSX.Element => {
  const { showerrorsnack } = useSnackbar();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(false);
  const [coinsData, setCoinsData] = useState<coinType[]>([]);

  const usdFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "symbol",
    compactDisplay: "short",
    unitDisplay: "short",
  });

  const getCoins = useCallback(async () => {
    setLoading(true);

    const { coins, isOk } = await fetchCoins();

    if (isOk) {
      setLoading(false);
      setCoinsData(coins);
    } else {
      setLoading(false);
      showerrorsnack("Failed to get the latest coin data");
    }
  }, []);

  useEffect(() => {
    getCoins();
  }, []);

  return (
    <section id="markettab">
      <p className="title">Market</p>

      {loading ? (
        <div className="animation">
          <Loading />
        </div>
      ) : (
        <div id="coins">
          {coinsData?.map((_coin) => (
            <div
              className="coin"
              key={_coin.id}
              onClick={() => navigate(`coin/${_coin.id}`)}
            >
              <div id="l_00">
                <img src={_coin.image} alt={_coin.name} />

                <div className="name_symbol">
                  <p className="name">{_coin.name}</p>
                  <p className="symbol">{_coin.symbol}</p>
                </div>
              </div>

              <span className="curr_price">
                {usdFormatter.format(_coin.current_price)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
