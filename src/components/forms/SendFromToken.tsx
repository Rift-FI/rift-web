import { JSX, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { SOCKET } from "../../utils/api/config";
import { spendOnBehalf } from "../../utils/api/wallet";
import { getEthUsdVal } from "../../utils/ethusd";
import { Loading } from "../../assets/animations";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { SendFromToken } from "../../assets/icons";
import { colors } from "../../constants";
import foreignspend from "../../assets/images/obhehalfspend.png";
import "../../styles/components/forms.scss";

function base64ToString(base64: string | null): string {
  try {
    if (!base64) throw new Error("Base64 string is missing");
    return decodeURIComponent(escape(atob(base64)));
  } catch (error) {
    return "Invalid value";
  }
}

// foreign spend - send eth to my address from shared link
export const SendEthFromToken = (): JSX.Element => {
  const navigate = useNavigate();
  const { invalidateQueries } = useQueryClient();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  let localethValue = localStorage.getItem("ethvalue");

  const { data: ethusdval } = useQuery({
    queryKey: ["ethusd"],
    queryFn: getEthUsdVal,
  });

  const [eThvalLoading, setEThvalLoading] = useState<boolean>(false);
  const [ethValinUSd, setEthValinUSd] = useState<number>(0.0);

  const [disableReceive, setdisableReceive] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [httpSuccess, sethttpSuccess] = useState<boolean>(false);

  const getUSDToEthValue = useCallback(async () => {
    if (localethValue == null) {
      setEThvalLoading(true);

      setEthValinUSd(Number(ethusdval));
      setEThvalLoading(false);
    } else {
      setEthValinUSd(Number(localethValue));
    }
  }, []);

  let access = localStorage.getItem("token");
  let utxoId = localStorage.getItem("utxoId");
  let address = localStorage.getItem("address");

  const { mutate: mutateCollectEth } = useMutation({
    mutationFn: () =>
      spendOnBehalf(access as string, address as string, utxoId as string),
    onSuccess: (res) => {
      localStorage.removeItem("utxoId");

      if (res.status == 200) {
        sethttpSuccess(true);
        showsuccesssnack("Please wait for the transaction...");
      } else if (res.status == 403) {
        showerrorsnack("This link has expired");
        closeAppDrawer();
        navigate("/app");
      } else if (res.status == 404) {
        showerrorsnack("This link has been used");
        closeAppDrawer();
      } else {
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
    if (httpSuccess) {
      SOCKET.on("TXSent", () => {
        localStorage.removeItem("utxoId");

        showsuccesssnack("Please hold on...");
      });
      SOCKET.on("TXConfirmed", () => {
        invalidateQueries({ queryKey: ["btceth"] });
        localStorage.removeItem("utxoId");

        setProcessing(false);
        showsuccesssnack(
          `Successfully collected ${base64ToString(
            localStorage.getItem("utxoVal") as string
          )} ETH`
        );

        closeAppDrawer();
        navigate("/app");
      });

      return () => {
        SOCKET.off("TXSent");
        SOCKET.off("TXConfirmed");
      };
    }
  }, [httpSuccess]);

  useEffect(() => {
    getUSDToEthValue();
  }, []);

  return (
    <div id="sendethfromtoken">
      <img src={foreignspend} alt="Foreign spend" />

      <p>
        Click 'Receive' to collect&nbsp;
        {eThvalLoading
          ? "- - -"
          : `${(
              Number(
                base64ToString(localStorage.getItem("utxoVal") as string)
              ) * ethValinUSd
            ).toFixed(2)} USD`}
      </p>

      <button
        disabled={disableReceive}
        onClick={() => {
          setdisableReceive(true);
          mutateCollectEth();
        }}
      >
        {processing ? (
          <Loading width="1.5rem" height="1.5rem" />
        ) : (
          <>
            Receive <SendFromToken color={colors.textprimary} />
          </>
        )}
      </button>
    </div>
  );
};
