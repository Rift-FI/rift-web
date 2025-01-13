import { JSX, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { AppDrawer } from "../components/global/AppDrawer";
import { SnackBar } from "../components/global/SnackBar";
import { useSnackbar } from "../hooks/snackbar";
import { uSdTBalance } from "../utils/api/wallet";
import { formatUsd } from "../utils/formatters";
import { Copy, Send, Receive } from "../assets/icons";
import { colors } from "../constants";
import usdclogo from "../assets/images/labs/usdc.png";
import "../styles/pages/assets.css";

export default function UsdtAsset(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack } = useSnackbar();

  const [accBalLoading, setAccBalLoading] = useState<boolean>(false);
  const [usdtAccBalance, setusdtAccBalance] = useState<number>(0);

  const backbuttonclick = () => {
    navigate(-1);
  };

  let walletAddress = localStorage.getItem("address");
  let usdtbal = localStorage.getItem("usdtbal");

  const onCopyAddr = () => {
    if (walletAddress !== null) {
      navigator.clipboard.writeText(walletAddress as string);
      showsuccesssnack("Address copied to clipboard");
    }
  };

  const onGetBalance = useCallback(async () => {
    if (usdtbal == null) {
      setAccBalLoading(true);

      let access: string | null = localStorage.getItem("token");
      const { data } = await uSdTBalance(access as string);
      setusdtAccBalance(Number(data?.balance));

      setAccBalLoading(false);
    } else {
      setusdtAccBalance(Number(usdtbal));
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
    <section id="usdt-asset">
      <img src={usdclogo} alt="usdt" />

      <button className="address" onClick={onCopyAddr}>
        {walletAddress?.substring(0, 3)}...{walletAddress?.substring(4, 7)}
        <Copy width={14} height={16} color={colors.textsecondary} />
      </button>

      <div className="balance">
        <p>{accBalLoading ? "- - -" : `${formatUsd(usdtAccBalance)}`}</p>
        <span>{accBalLoading ? "- - -" : `${usdtAccBalance} USDC`}</span>
      </div>

      <div className="actions">
        <p>Send USDC directly to another address</p>

        <span className="divider" />

        <div className="buttons">
          <button className="receive" onClick={onCopyAddr}>
            Receive
            <Receive width={18} height={18} color={colors.textprimary} />
          </button>

          <button className="send" onClick={() => navigate("/send-usdc")}>
            Send USDC <Send width={18} height={18} color={colors.textprimary} />
          </button>
        </div>
      </div>

      <SnackBar />
      <AppDrawer />
    </section>
  );
}
