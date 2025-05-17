import { JSX } from "react";
import { useNavigate } from "react-router";
import { openLink } from "@telegram-apps/sdk-react";
import { useQuery } from "@tanstack/react-query";
import { useBackButton } from "../hooks/backbutton";
import { getTransactionHistory } from "../utils/api/wallet";
import { formatDateToStr, dateDistance } from "../utils/dates";
import { ArrowRightUp } from "../assets/icons";
import { colors } from "../constants";
import ethlogo from "../assets/images/logos/eth.png";
import usdclogo from "../assets/images/logos/usdc.png";
import wberalogo from "../assets/images/logos/bera.png";
import "../styles/pages/notifications.scss";

export default function Notifications(): JSX.Element {
  const navigate = useNavigate();

  const goBack = () => {
    navigate("/profile");
  };

  const { data: transactionshistory } = useQuery({
    queryKey: ["txhistory"],
    queryFn: getTransactionHistory,
  });

  const polygonscan = "https://polygonscan.com/tx/"; //-> USDT
  const berascan = "https://berascan.com/search?q="; //-> WBERA, WUSDC
  const etherscan = "https://etherscan.io/search?f=0&q="; //-> ETH

  useBackButton(goBack);

  return (
    <div className="notifications">
      <p className="title_desc">
        Tranasction History
        <span>Transactions you do on Sphere will be listed here</span>
      </p>
      <div className="notifs">
        {transactionshistory?.transactions?.map((_tx, idx) => (
          <div
            className="notification"
            key={_tx?.id + idx}
            onClick={() => {
              _tx?.currency == "USDC"
                ? openLink(polygonscan + _tx?.transactionHash)
                : _tx?.currency == "ETH"
                ? openLink(etherscan + _tx?.transactionHash)
                : openLink(berascan + _tx?.transactionHash);
            }}
          >
            <img
              src={
                _tx?.currency == "ETH"
                  ? ethlogo
                  : _tx?.currency == "WBERA"
                  ? wberalogo
                  : usdclogo
              }
              alt={_tx?.currency}
            />

            <div className="currency_link">
              <p className="currency">
                {_tx?.amount}&nbsp;
                {_tx?.currency === "WUSDC"
                  ? "USDC.e"
                  : _tx?.currency == "WBERA"
                  ? "BERA"
                  : _tx?.currency}
              </p>

              <p className="link">
                <>
                  {formatDateToStr(_tx?.createdAt)} (
                  {dateDistance(_tx?.createdAt)})
                </>
                <span>
                  {_tx?.transactionHash?.substring(0, 6) + "..."}
                  <ArrowRightUp color={colors.accent} />
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
