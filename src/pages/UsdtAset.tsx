import { JSX, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { AppDrawer } from "../components/global/AppDrawer";
import { useSnackbar } from "../hooks/snackbar";
import { useAppDrawer } from "../hooks/drawer";
import { uSdTBalance } from "../utils/api/wallet";
import { formatUsd } from "../utils/formatters";
import { Copy, Send, Receive } from "../assets/icons";
import { colors } from "../constants";
import usdtlogo from "../assets/images/usdt.png";
import "../styles/pages/assets.css";

export default function UsdtAsset(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack } = useSnackbar();
  const { drawerOpen, openAppDrawer } = useAppDrawer();

  const [accBalLoading, setAccBalLoading] = useState<boolean>(false);
  const [usdtAccBalance, setusdtAccBalance] = useState<number>(0);

  if (backButton.isMounted()) {
    backButton.onClick(() => {
      navigate(-1);
    });
  }

  let walletAddress = localStorage.getItem("address");

  const onCopyAddr = () => {
    if (walletAddress !== null) {
      navigator.clipboard.writeText(walletAddress as string);
      showsuccesssnack("USDT address copied to clipboard");
    }
  };

  const onGetBalance = useCallback(async () => {
    setAccBalLoading(true);

    let access: string | null = localStorage.getItem("token");
    const { data } = await uSdTBalance(access as string);
    setusdtAccBalance(Number(data?.balance));

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
    <section id="usdt-asset">
      <img src={usdtlogo} alt="usdt" />

      <button className="address" onClick={onCopyAddr}>
        {walletAddress?.substring(0, 3)}...{walletAddress?.substring(4, 7)}
        <Copy width={14} height={16} color={colors.textsecondary} />
      </button>

      <div className="balance">
        <p>{accBalLoading ? "- - -" : `${formatUsd(usdtAccBalance)}`}</p>
        <span>{accBalLoading ? "- - -" : `${usdtAccBalance} USDT`}</span>
      </div>

      <div className="actions">
        <button className="send" onClick={() => openAppDrawer("sendusdt")}>
          Send USDT <Send width={18} height={18} color={colors.textprimary} />
        </button>

        <button className="receive" onClick={onCopyAddr}>
          Receive USDT
          <Receive width={18} height={18} color={colors.textprimary} />
        </button>
      </div>

      <AppDrawer />
    </section>
  );
}
