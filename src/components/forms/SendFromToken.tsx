import { JSX, useEffect, useState } from "react";

import { SOCKET } from "../../utils/api/config";
import { spendOnBehalf } from "../../utils/api/wallet";
import { Loading } from "../../assets/animations";
import { useSnackbar } from "../../hooks/snackbar";
import { SendFromToken } from "../../assets/icons";
import { colors } from "../../constants";
import foreignspend from "../../assets/images/obhehalfspend.png";
import "../../styles/components/forms.css";

export const SendEthFromToken = (): JSX.Element => {
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const [disabled, setDisabled]=useState(false)

  function base64ToString(base64: string | null): string {
  try {
    if (!base64) throw new Error("Base64 string is missing");
    return decodeURIComponent(escape(atob(base64)));
  } catch (error) {
    console.error("Error decoding base64:", error);
    return "Invalid value";
  }
}

  // receiverAddress -> to
 
  const [processing, setProcessing] = useState<boolean>(false);
  const [httpSuccess, sethttpSuccess] = useState<boolean>(false);

  const onSpendOnBehalf = async () => {
 
      setProcessing(true);
      setDisabled(true)
      showsuccesssnack("Please wait...");

      let access = localStorage.getItem("token");
      let utxoId = localStorage.getItem("utxoId");

      const { spendOnBehalfSuccess, status } = await spendOnBehalf(
        access as string,
        localStorage.getItem("address") as string,
        utxoId as string
      );
// alert(spendOnBehalfSuccess )
// alert(status)
      if (spendOnBehalfSuccess == true && status==200) {
        sethttpSuccess(true);
       
      } else if ( spendOnBehalfSuccess == true && status == 401) {
        showerrorsnack("You are not authorised to redeem");
       
      }
       else if ( spendOnBehalfSuccess == true &&  status == 403) {
        showerrorsnack("The redeem code expired!");
       
      }
      
      else {
        showerrorsnack("An unexpected error occurred");
      }

      setProcessing(false);
      setDisabled(false)
    
  };

  useEffect(() => {
    if (httpSuccess) {
      SOCKET.on("TXSent", () => {
        showsuccesssnack("Please hold on...");
      });
      SOCKET.on("TXConfirmed", () => {
        setProcessing(false);
        showsuccesssnack("The transaction was completed successfully");
      });

      return () => {
        SOCKET.off("connect");
        SOCKET.off("disconnect");
      };
    }
  }, [httpSuccess]);

  return (
    <div id="sendethfromtoken">
      <img src={foreignspend} alt="Foreign spend" />

      <p>Click to receive {base64ToString(localStorage.getItem("utxoVal") as string)} ETH</p>

    

      <button disabled={disabled}  onClick={onSpendOnBehalf}>
        {processing ? (
          <Loading />
        ) : (
          <>
            Redeem <SendFromToken color={colors.textprimary} />
          </>
        )}
      </button>
    </div>
  );
};
