import { JSX } from "react";
import { useNavigate } from "react-router";
import { Skeleton } from "@mui/material";
import { coinType } from "../../../types/earn";
import { formatUsd } from "../../../utils/formatters";
import { colors } from "../../../constants";
import "../../../styles/components/tabs/coins.scss";

interface props {
  coinsdata: coinType[];
  coinsLoading: boolean;
}

export const Coins = ({ coinsdata, coinsLoading }: props): JSX.Element => {
  const navigate = useNavigate();

  const indexOfOM = coinsdata?.findIndex((_coin) => _coin?.symbol == "om");
  const [arrWithoutOM] = coinsdata?.splice(indexOfOM, 1);
  coinsdata.unshift(arrWithoutOM);

  return (
    <section id="markettab">
      <p className="title">Coins</p>

      {coinsLoading ? (
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
        </div>
      ) : (
        <div id="coins">
          {coinsdata?.map((_coin) => (
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
      )}
    </section>
  );
};
