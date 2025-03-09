import { JSX, useEffect, useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { faCircleArrowDown } from "@fortawesome/free-solid-svg-icons";
import { SOCKET } from "../../utils/api/config";
import { spendOnBehalf } from "../../utils/api/wallet";
import { getEthUsdVal } from "../../utils/ethusd";
import { base64ToString } from "../../utils/base64";
import { SubmitButton } from "../global/Buttons";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import foreignspend from "../../assets/images/obhehalfspend.png";
import "../../styles/components/forms.scss";

// foreign spend - send eth to my address from shared link
export const SendEthFromToken = (): JSX.Element => {
  const queryclient = useQueryClient();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  let utxoVal = localStorage.getItem("utxoVal");

  const { data: ethusdval, isPending } = useQuery({
    queryKey: ["ethusd"],
    queryFn: getEthUsdVal,
  });

  const [processing, setProcessing] = useState<boolean>(false);

  const collectValue = (
    Number(base64ToString(utxoVal)) * Number(ethusdval)
  ).toFixed(2);

  let access = localStorage.getItem("token");
  let utxoId = localStorage.getItem("utxoId");
  let utxoIntent = localStorage.getItem("utxoIntent");
  let address = localStorage.getItem("address");

  const { mutate: mutateCollectEth, isSuccess } = useMutation({
    mutationFn: () =>
      spendOnBehalf(
        access as string,
        address as string,
        utxoId as string,
        utxoIntent as string
      ),
    onSuccess: (res) => {
      localStorage.removeItem("utxoId");

      if (res.status == 200) {
        localStorage.removeItem("utxoId");

        showsuccesssnack("Please wait for the transaction...");
      } else if (res.status == 403) {
        localStorage.removeItem("utxoId");
        showerrorsnack("This link has expired");
        closeAppDrawer();
      } else if (res.status == 404) {
        localStorage.removeItem("utxoId");
        showerrorsnack("This link has been used");
        closeAppDrawer();
      } else {
        localStorage.removeItem("utxoId");
        showerrorsnack("An unexpected error occurred");
        closeAppDrawer();
      }
    },
    onError: () => {
      localStorage.removeItem("utxoId");
      showerrorsnack("An unexpected error occurred");
      closeAppDrawer();
    },
  });

  useEffect(() => {
    if (isSuccess) {
      localStorage.removeItem("utxoId");

      SOCKET.on("TXConfirmed", () => {
        localStorage.removeItem("utxoId");

        queryclient.invalidateQueries({ queryKey: ["btceth"] });

        setProcessing(false);
        showsuccesssnack(
          `Successfully collected ${base64ToString(
            localStorage.getItem("utxoVal") as string
          )} ETH`
        );

        closeAppDrawer();
      });
      SOCKET.on("TXFailed", () => {
        localStorage.removeItem("utxoId");

        setProcessing(false);
        showerrorsnack("The transaction could not be completed");
        closeAppDrawer();
      });

      return () => {
        SOCKET.off("TXConfirmed");
        SOCKET.off("TXFailed");
      };
    }
  }, [isSuccess]);

  return (
    <div id="sendethfromtoken">
      <img src={foreignspend} alt="Foreign spend" />

      <p>
        Click 'Receive' to collect&nbsp;
        {isPending ? "- - -" : `${collectValue} USD`}
      </p>

      <SubmitButton
        text="Receive"
        icon={<FaIcon faIcon={faCircleArrowDown} color={colors.textprimary} />}
        isLoading={isSuccess || processing}
        isDisabled={isSuccess || processing}
        onclick={mutateCollectEth}
      />
    </div>
  );
};
