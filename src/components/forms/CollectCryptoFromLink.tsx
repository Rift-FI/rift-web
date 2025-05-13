import { JSX, useEffect, useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { useSocket } from "../../utils/SocketProvider";
import { spendOnBehalf } from "../../utils/api/wallet";
import { fetchCoinInfo } from "../../utils/coingecko/markets";
import { numberFormat } from "../../utils/formatters";
import { base64ToString } from "../../utils/base64";
import { TransactionStatusWithoutSocket } from "../TransactionStatus";
import ethlogo from "../../assets/images/logos/eth.png";
import wberalogo from "../../assets/images/logos/bera.png";
import usdclogo from "../../assets/images/logos/usdc.png";
import "../../styles/components/drawer/collectcryptofromlink.scss";
import { Loading } from "../../assets/animations";

export const CollectCryptoFromLink = (): JSX.Element => {
  const queryclient = useQueryClient();
  const { socket } = useSocket();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  const [showTxStatus, setShowTxStatus] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<"PENDING" | "PROCESSED" | "FAILED">(
    "PENDING"
  );
  const [txMessage, setTxMessage] = useState<string>("");

  const { data: ethereumInfo, isPending: ethinfofetching } = useQuery({
    queryKey: ["ethinfo"],
    queryFn: () => fetchCoinInfo("ethereum"),
  });

  const { data: usdcInfo, isPending: usdcinfofetching } = useQuery({
    queryKey: ["usdcinfo"],
    queryFn: () => fetchCoinInfo("usd-coin"),
  });

  const { data: beraInfo, isPending: berainfofetching } = useQuery({
    queryKey: ["berachainbera"],
    queryFn: () => fetchCoinInfo("berachain-bera"),
  });

  let access = localStorage.getItem("spheretoken");
  let utxoId = localStorage.getItem("utxoId");
  let utxoVal = localStorage.getItem("utxoVal");
  let utxoIntent = localStorage.getItem("utxoIntent");
  let utxoCurrency = localStorage.getItem("utxoCurrency");
  let address = localStorage.getItem("ethaddress");

  const multiplier: number =
    utxoCurrency === "ETH"
      ? Number(ethereumInfo?.market_data?.current_price?.usd)
      : utxoCurrency === "WBREA"
      ? Number(beraInfo?.market_data?.current_price?.usd)
      : Number(usdcInfo?.market_data?.current_price?.usd);
  const collectValue = (Number(base64ToString(utxoVal)) * multiplier).toFixed(
    2
  );

  const { mutate: mutateCollectCrypto, isPending } = useMutation({
    mutationFn: () =>
      spendOnBehalf(
        access as string,
        address as string,
        utxoId as string,
        utxoIntent as string
      )
        .then((res) => {
          if (res.status == 200) {
            setTxStatus("PENDING");
            setTxMessage(
              `Transferring ${numberFormat(
                Number(base64ToString(utxoVal))
              )} ${utxoCurrency}`
            );
            setShowTxStatus(true);
          } else if (res.status == 403) {
            showerrorsnack("This link has expired");
            closeAppDrawer();
          } else if (res.status == 404) {
            showerrorsnack("This link has been used");
            closeAppDrawer();
          } else {
            showerrorsnack("An unexpected error occurred");
            closeAppDrawer();
          }
        })
        .catch(() => {
          showerrorsnack("An unexpected error occurred");
          closeAppDrawer();
        }),
  });

  useEffect(() => {
    if (!socket) return;

    const handleTxConfirmed = () => {
      setTxStatus("PROCESSED");
      setTxMessage("Transaction completed");
      setShowTxStatus(true);

      Promise.all([
        queryclient.invalidateQueries({ queryKey: ["ethusd"] }),
        queryclient.invalidateQueries({ queryKey: ["mantrausd"] }),
        queryclient.invalidateQueries({ queryKey: ["btcusd"] }),
        queryclient.invalidateQueries({ queryKey: ["btceth"] }),
        queryclient.invalidateQueries({ queryKey: ["mantrabalance"] }),
        queryclient.invalidateQueries({ queryKey: ["usdcbalance"] }),
      ])
        .then(() => {
          showsuccesssnack(
            `Successfully collected ${base64ToString(utxoVal)} ${utxoCurrency}`
          );

          setTimeout(() => {
            setShowTxStatus(false);
            closeAppDrawer();
          }, 4500);
        })
        .catch((error) => {
          console.error("Failed to refresh balances:", error);
          showsuccesssnack(
            `Successfully collected ${base64ToString(
              utxoVal
            )} ${utxoCurrency}. Please refresh for updated balances.`
          );
          setTimeout(() => {
            setShowTxStatus(false);
            closeAppDrawer();
          }, 4500);
        });
    };

    const handleTxFailed = () => {
      setTxStatus("FAILED");
      setTxMessage("Transaction failed");
      setShowTxStatus(true);

      showerrorsnack("The transaction could not be completed");
      closeAppDrawer();
    };

    socket.on("TXConfirmed", handleTxConfirmed);
    socket.on("TXFailed", handleTxFailed);

    return () => {
      socket.off("TXConfirmed", handleTxConfirmed);
      socket.off("TXFailed", handleTxFailed);
    };
  }, [
    socket,
    queryclient,
    utxoVal,
    showsuccesssnack,
    showerrorsnack,
    closeAppDrawer,
  ]);

  return (
    <div id="collectcryptofromlink">
      <p className="title-desc">
        You have received crypto via a secure Sphere Link Please click “Receive”
        to transfer&nbsp;
        {ethinfofetching || berainfofetching || usdcinfofetching
          ? "- - -"
          : `${collectValue} USD`}
        &nbsp;to your wallet Click <span>'Receive'</span> to collect
      </p>

      <div className="yourassetbalance">
        <img
          src={
            utxoCurrency === "ETH"
              ? ethlogo
              : utxoCurrency === "WBERA"
              ? wberalogo
              : usdclogo
          }
          alt="asset"
        />

        <p className="balance">
          {utxoVal}
          <span>${collectValue}</span>
        </p>
      </div>

      <button disabled={isPending} onClick={() => mutateCollectCrypto()}>
        {isPending ? <Loading width="1.25rem" height="1.25rem" /> : "Receive"}
      </button>

      {showTxStatus && (
        <TransactionStatusWithoutSocket
          transactionStatus={txStatus}
          transactionMessage={txMessage}
        />
      )}
    </div>
  );
};
