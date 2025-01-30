import { JSX, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { useSnackbar } from "../hooks/snackbar";
import { mantraBalance } from "../utils/api/wallet";
import { formatUsd, formatNumber } from "../utils/formatters";
import { Copy, Receive } from "../assets/icons";
import { colors } from "../constants";
import usdclogo from "../assets/images/labs/mantralogo.jpeg";
import "../styles/pages/assets.scss";

export default function OmAsset(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack } = useSnackbar();

  const [accBalLoading, setAccBalLoading] = useState<boolean>(false);
  const [mantraBal, setMantrBal] = useState<number>(0);
  const [mantraBalUsd, setMantrBalUsd] = useState<number>(0);

  const backbuttonclick = () => {
    navigate(-1);
  };

  let walletAddress = localStorage.getItem("address");
  let mantrabal = localStorage.getItem("mantrabal");
  let mantrabalusd = localStorage.getItem("mantrabalusd");

  const onCopyAddr = () => {
    if (walletAddress !== null) {
      navigator.clipboard.writeText(walletAddress as string);
      showsuccesssnack("Address copied to clipboard");
    }
  };

  const onGetBalance = useCallback(async () => {
    if (mantrabal == null || mantrabalusd == null) {
      setAccBalLoading(true);

      let mantrausdval = localStorage.getItem("mantrausdval");
      let access: string | null = localStorage.getItem("token");

      const { data } = await mantraBalance(access as string);
      const mantrabalusd = Number(data?.balance) * Number(mantrausdval);

      setMantrBal(Number(data?.balance));
      setMantrBalUsd(mantrabalusd);

      setAccBalLoading(false);
    } else {
      setMantrBal(Number(mantrabal));
      setMantrBalUsd(Number(mantrabalusd));
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
    <section id="om-asset">
      <img src={usdclogo} alt="usdt" />

      <button className="address" onClick={onCopyAddr}>
        {walletAddress?.substring(0, 3)}...{walletAddress?.substring(4, 7)}
        <Copy width={14} height={16} color={colors.textsecondary} />
      </button>

      <div className="balance">
        <p>{accBalLoading ? "- - -" : `${formatUsd(mantraBalUsd)}`}</p>
        <span>{accBalLoading ? "- - -" : `${formatNumber(mantraBal)} OM`}</span>
      </div>

      <div className="actions">
        <p>Receive & buy OM Tokens</p>

        <span className="divider" />

        <div className="buttons">
          <button className="receive" onClick={onCopyAddr}>
            Receive
            <Receive width={18} height={18} color={colors.textprimary} />
          </button>

          <button className="send" onClick={() => navigate("/get-om")}>
            Get OM
          </button>
        </div>
      </div>
    </section>
  );
}
