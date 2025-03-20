import { JSX, useEffect, useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { faCircleArrowDown } from "@fortawesome/free-solid-svg-icons";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { useSocket } from "../../utils/SocketProvider";
import { spendOnBehalf } from "../../utils/api/wallet";
import { getBtcUsdVal, getEthUsdVal } from "../../utils/ethusd";
import { numberFormat } from "../../utils/formatters";
import { getMantraUsdVal } from "../../utils/api/mantra";
import { base64ToString } from "../../utils/base64";
import { TransactionStatusWithoutSocket } from "../TransactionStatus";
import { SubmitButton } from "../global/Buttons";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import foreignspend from "../../assets/images/obhehalfspend.png";
import "../../styles/components/forms.scss";

// collect crypto to my address from a shared (collect) link
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

  const { data: ethusdval, isFetching: ethusdloading } = useQuery({
    queryKey: ["ethusd"],
    queryFn: getEthUsdVal,
  });
  const { data: mantrausdval, isFetching: mantrausdloading } = useQuery({
    queryKey: ["mantrausd"],
    queryFn: getMantraUsdVal,
  });
  const { data: btcusdval, isFetching: btcusdloading } = useQuery({
    queryKey: ["btcusd"],
    queryFn: getBtcUsdVal,
  });

  const [processing, setProcessing] = useState<boolean>(false);

  let access = localStorage.getItem("spheretoken");
  let utxoId = localStorage.getItem("utxoId");
  let utxoVal = localStorage.getItem("utxoVal");
  let utxoIntent = localStorage.getItem("utxoIntent");
  let utxoCurrency = localStorage.getItem("utxoCurrency");
  let address = localStorage.getItem("ethaddress");

  const multiplier: number =
    utxoCurrency === "ETH"
      ? Number(ethusdval)
      : utxoCurrency === "OM"
      ? Number(mantrausdval)
      : utxoCurrency === "BTC"
      ? Number(btcusdval)
      : 0.99;
  const collectValue = (Number(base64ToString(utxoVal)) * multiplier).toFixed(
    2
  );

  const { mutate: mutateCollectCrypto, isSuccess } = useMutation({
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

    socket.on("TXConfirmed", () => {
      setTxStatus("PROCESSED");
      setTxMessage("Transaction completed");
      setShowTxStatus(true);

      queryclient.invalidateQueries({
        queryKey: ["btceth", "mantrabalance", "usdcbalance"],
      });

      showsuccesssnack(`Successfully collected ${base64ToString(utxoVal)} ETH`);

      closeAppDrawer();

      setTimeout(() => {
        setShowTxStatus(false);
      }, 4500);
    });
    socket.on("TXFailed", () => {
      setTxStatus("FAILED");
      setTxMessage("Transaction failed");
      setShowTxStatus(true);

      setProcessing(false);
      showerrorsnack("The transaction could not be completed");
      closeAppDrawer();
    });

    return () => {
      socket.off("TXConfirmed");
      socket.off("TXFailed");
    };
  }, [showTxStatus]);

  return (
    <div id="sendethfromtoken">
      <img src={foreignspend} alt="Foreign spend" />

      <p>
        Click <span>'Receive'</span> to collect&nbsp;
        {ethusdloading || btcusdloading || mantrausdloading
          ? "- - -"
          : `${collectValue} USD`}
      </p>

      <SubmitButton
        text="Receive"
        icon={<FaIcon faIcon={faCircleArrowDown} color={colors.textprimary} />}
        isLoading={isSuccess || processing}
        isDisabled={
          isSuccess ||
          processing ||
          ethusdloading ||
          btcusdloading ||
          mantrausdloading
        }
        sxstyles={{
          marginTop: "0.5rem",
          padding: "0.625rem",
          borderRadius: "1.5rem",
          backgroundColor: colors.success,
        }}
        onclick={mutateCollectCrypto}
      />

      {showTxStatus && (
        <TransactionStatusWithoutSocket
          transactionStatus={txStatus}
          transactionMessage={txMessage}
        />
      )}
    </div>
  );
};
