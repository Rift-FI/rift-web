import { JSX, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { AppDrawer } from "../components/global/AppDrawer";
import { useSnackbar } from "../hooks/snackbar";
import { useAppDrawer } from "../hooks/drawer";
import { getBtcUsdVal } from "../utils/ethusd";
import { formatUsd } from "../utils/formatters";
import { walletBalance } from "../utils/api/wallet";
import { Copy, Send, Receive } from "../assets/icons";
import { colors } from "../constants";
import btclogo from "../assets/images/btc.png";
import "../styles/pages/assets.css";

export default function BtcAsset(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack } = useSnackbar();
  const { drawerOpen, openAppDrawer } = useAppDrawer();

  const [accBalLoading, setAccBalLoading] = useState<boolean>(false);
  const [btcAccBalance, setBtcAccAccBalance] = useState<number>(0);
  const [btcAccBalanceUsd, setBtcAccAccBalanceUsd] = useState<number>(0);

  if (backButton.isMounted()) {
    backButton.onClick(() => {
      navigate(-1);
    });
  }

  let walletAddress = localStorage.getItem("btcaddress");

  const onCopyAddr = () => {
    if (walletAddress !== null) {
      navigator.clipboard.writeText(walletAddress as string);
      showsuccesssnack("BTC address copied to clipboard");
    }
  };

  const onGetBalance = useCallback(async () => {
    setAccBalLoading(true);

    let access: string | null = localStorage.getItem("token");

    const { btcBalance } = await walletBalance(access as string);
    const { btcQtyInUSD } = await getBtcUsdVal(Number(btcBalance));

    setBtcAccAccBalance(btcBalance);
    setBtcAccAccBalanceUsd(btcQtyInUSD);

    setAccBalLoading(false);
  }, []);

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    return () => {
      backButton.unmount();
    };
  }, [drawerOpen]);

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
        <button className="send" onClick={() => openAppDrawer("sendbtc")}>
          Send BTC <Send width={18} height={18} color={colors.textprimary} />
        </button>
        <button className="receive" onClick={onCopyAddr}>
          Receive BTC
          <Receive width={18} height={18} color={colors.textprimary} />
        </button>
      </div>

      <AppDrawer />
    </section>
  );
}
