import { JSX, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { AppDrawer } from "../components/global/AppDrawer";
import { SnackBar } from "../components/global/SnackBar";
import { useSnackbar } from "../hooks/snackbar";
import { useAppDrawer } from "../hooks/drawer";
import { getEthUsdVal } from "../utils/ethusd";
import { walletBalance } from "../utils/api/wallet";
import { formatUsd } from "../utils/formatters";
import { Copy, Send, Receive } from "../assets/icons";
import { colors } from "../constants";
import ethlogo from "../assets/images/eth.png";
import "../styles/pages/assets.css";

export default function EthAsset(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack } = useSnackbar();
  const { openAppDrawer, drawerOpen } = useAppDrawer();

  const [accBalLoading, setAccBalLoading] = useState<boolean>(false);
  const [accBalance, setAccBalance] = useState<number>(0);
  const [amountInUsd, setAmountInUsd] = useState<number>(0);

  if (backButton.isMounted()) {
    backButton.onClick(() => {
      navigate(-1);
    });
  }

  let walletAddress = localStorage.getItem("address");
  let ethbal = localStorage.getItem("ethbal");
  let ethbalUsd = localStorage.getItem("ethbalUsd");

  const onCopyAddr = () => {
    if (walletAddress !== null) {
      navigator.clipboard.writeText(walletAddress as string);
      showsuccesssnack("Address copied to clipboard");
    }
  };

  const onGetBalance = useCallback(async () => {
    if (ethbal == null || ethbalUsd == null) {
      setAccBalLoading(true);

      let access: string | null = localStorage.getItem("token");

      const { balance } = await walletBalance(access as string);
      const { ethInUSD } = await getEthUsdVal(Number(balance));

      setAccBalance(Number(balance));
      setAmountInUsd(ethInUSD);

      setAccBalLoading(false);
    } else {
      setAccBalance(Number(ethbal));
      setAmountInUsd(Number(ethbalUsd));
    }
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
    <section id="eth-asset">
      <img src={ethlogo} alt="eth" />

      <button className="address" onClick={onCopyAddr}>
        {walletAddress?.substring(0, 3)}...{walletAddress?.substring(4, 7)}
        <Copy width={14} height={16} color={colors.textsecondary} />
      </button>

      <div className="balance">
        <p>{accBalLoading ? "- - -" : `${formatUsd(amountInUsd)}`}</p>
        <span>{accBalLoading ? "- - -" : `${accBalance?.toFixed(8)} ETH`}</span>
      </div>

      <div className="actions">
        <button className="send" onClick={() => openAppDrawer("sendoptions")}>
          Send ETH <Send width={18} height={18} color={colors.textprimary} />
        </button>
        <button className="receive" onClick={onCopyAddr}>
          Receive ETH
          <Receive width={18} height={18} color={colors.textprimary} />
        </button>
      </div>

      <SnackBar />
      <AppDrawer />
    </section>
  );
}
