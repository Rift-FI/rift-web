import { JSX } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@mui/material";
import { formatUsd } from "../../../utils/formatters";
import { coinType, fetchCoins } from "../../../utils/api/market";
import { colors } from "../../../constants";
import "../../../styles/components/tabs/coins.scss";

export const Coins = (): JSX.Element => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["coins"],
    queryFn: fetchCoins,
    refetchInterval: 3000,
  });
  const coinsData = data as coinType[];

  return (
    <section id="markettab">
      <p className="title">Coins</p>

      {isLoading && (
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
            onClick={() => navigate(`/coin/${_coin.id}`)}
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
