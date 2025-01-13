import { JSX, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { AppDrawer } from "../components/global/AppDrawer";
import { SnackBar } from "../components/global/SnackBar";
import { useSnackbar } from "../hooks/snackbar";
import { getBtcUsdVal } from "../utils/ethusd";
import { formatUsd } from "../utils/formatters";
import { walletBalance } from "../utils/api/wallet";
import { Copy, Receive, Send } from "../assets/icons";
import { colors } from "../constants";
import btclogo from "../assets/images/btc.png";
import "../styles/pages/assets.css";

export default function BtcAsset(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack } = useSnackbar();

  const [accBalLoading, setAccBalLoading] = useState<boolean>(false);
  const [btcAccBalance, setBtcAccAccBalance] = useState<number>(0);
  const [btcAccBalanceUsd, setBtcAccAccBalanceUsd] = useState<number>(0);

  const backbuttonclick = () => {
    navigate(-1);
  };

  let walletAddress = localStorage.getItem("btcaddress");
  let btcbal = localStorage.getItem("btcbal");
  let btcbalUsd = localStorage.getItem("btcbalUsd");

  const onCopyAddr = () => {
    if (walletAddress !== null) {
      navigator.clipboard.writeText(walletAddress as string);
      showsuccesssnack("Address copied to clipboard");
    }
  };

  const onGetBalance = useCallback(async () => {
    if (btcbal == null || btcbalUsd == null) {
      setAccBalLoading(true);

      let access: string | null = localStorage.getItem("token");

      const { btcBalance } = await walletBalance(access as string);
      const { btcQtyInUSD } = await getBtcUsdVal(Number(btcBalance));

      setBtcAccAccBalance(btcBalance);
      setBtcAccAccBalanceUsd(btcQtyInUSD);

      setAccBalLoading(false);
    } else {
      setBtcAccAccBalance(Number(btcbal));
      setBtcAccAccBalanceUsd(Number(btcbalUsd));
    }
  }, []);

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(backbuttonclick);
    }

    return () => {
      backButton.unmount();
    };
  }, []);

  useEffect(() => {
    onGetBalance();
  }, []);

  return (
    <section id="btc-asset">
      <img src={btclogo} alt="btc" />

      <button className="address" onClick={onCopyAddr}>
        {walletAddress?.substring(0, 3)}...{walletAddress?.substring(4, 7)}
        <Copy width={14} height={16} color={colors.textsecondary} />
      </button>

      <div className="balance">
        <p>{accBalLoading ? "- - -" : `${formatUsd(btcAccBalanceUsd)}`}</p>
        <span>
          {accBalLoading ? "- - -" : `${btcAccBalance?.toFixed(8)} BTC`}
        </span>
      </div>

      <div className="actions">
        <p>Send BTC directly to another address</p>

        <span className="divider" />

        <div className="buttons">
          <button className="receive" onClick={onCopyAddr}>
            Receive
            <Receive width={18} height={18} color={colors.textprimary} />
          </button>

          <button className="send" onClick={() => navigate("/send-btc")}>
            Send BTC <Send width={18} height={18} color={colors.textprimary} />
          </button>
        </div>
      </div>

      <SnackBar />
      <AppDrawer />
    </section>
  );
}
