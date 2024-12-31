import { JSX, useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { Skeleton } from "@mui/material";
import { useSnackbar } from "../../hooks/snackbar";
import { useTabs } from "../../hooks/tabs";
import { formatUsd } from "../../utils/formatters";
import { coinType, fetchCoins } from "../../utils/api/market";
import { colors } from "../../constants";
import "../../styles/components/tabs/markettab.css";

export const MarketTab = (): JSX.Element => {
  const { showerrorsnack } = useSnackbar();
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const [coinsData, setCoinsData] = useState<coinType[]>([]);

  if (backButton.isMounted()) {
    backButton.onClick(() => {
      switchtab("vault");
    });
  }

  const getCoins = useCallback(async () => {
    const { coins, isOk } = await fetchCoins();

    if (isOk) {
      setCoinsData(coins);
    } else {
      showerrorsnack("Failed to get the latest coin data");
    }
  }, []);

  useEffect(() => {
    getCoins();

    let interval = setInterval(() => {
      getCoins();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    return () => {
      backButton.unmount();
    };
  }, []);

  return (
    <section id="markettab">
      <p className="title">Market</p>

      {coinsData.length == 0 && (
        <div className="skeletons">
          <Skeleton
            animation="wave"
            width="100%"
            height="4.5rem"
            style={{ borderRadius: "0.25rem" }}
          />
          <Skeleton
            animation="wave"
            width="100%"
            height="4.5rem"
            style={{ borderRadius: "0.25rem" }}
          />
          <Skeleton
            animation="wave"
            width="100%"
            height="4.5rem"
            style={{ borderRadius: "0.25rem" }}
          />
          <Skeleton
            animation="wave"
            width="100%"
            height="4.5rem"
            style={{ borderRadius: "0.25rem" }}
          />
          <Skeleton
            animation="wave"
            width="100%"
            height="4.5rem"
            style={{ borderRadius: "0.25rem" }}
          />
          <Skeleton
            animation="wave"
            width="100%"
            height="4.5rem"
            style={{ borderRadius: "0.25rem" }}
          />
          <Skeleton
            animation="wave"
            width="100%"
            height="4.5rem"
            style={{ borderRadius: "0.25rem" }}
          />
          <Skeleton
            animation="wave"
            width="100%"
            height="4.5rem"
            style={{ borderRadius: "0.25rem" }}
          />
          <Skeleton
            animation="wave"
            width="100%"
            height="4.5rem"
            style={{ borderRadius: "0.25rem" }}
          />
          <Skeleton
            animation="wave"
            width="100%"
            height="4.5rem"
            style={{ borderRadius: "0.25rem" }}
          />
        </div>
      )}

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
              {formatUsd(_coin.current_price)} <br />
              <em
                style={{
                  fontStyle: "normal",
                  fontWeight: "600",
                  fontSize: "0.875rem",
                  color:
                    _coin?.price_change_percentage_24h < 0
                      ? colors.danger
                      : colors.success,
                }}
              >
                {_coin.price_change_percentage_24h > 0
                  ? `+${_coin.price_change_percentage_24h.toFixed(2)}%`
                  : `${_coin.price_change_percentage_24h.toFixed(2)}%`}
              </em>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
