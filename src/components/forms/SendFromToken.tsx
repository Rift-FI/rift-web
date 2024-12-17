import { JSX, useEffect, useState } from "react";
import { TextField } from "@mui/material";
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

  // receiverAddress -> to
  const [receiverAddress, setReceiverAddress] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [httpSuccess, sethttpSuccess] = useState<boolean>(false);

  const onSpendOnBehalf = async () => {
    if (receiverAddress == "") {
      showerrorsnack("Enter a destination address");
    } else {
      setProcessing(true);
      showsuccesssnack("Please wait...");

      let access = localStorage.getItem("token");
      let utxoId = localStorage.getItem("utxoId");

      const { spendOnBehalfSuccess, status } = await spendOnBehalf(
        access as string,
        receiverAddress,
        utxoId as string
      );

      if (spendOnBehalfSuccess == true) {
        sethttpSuccess(true);
       
      } else if (spendOnBehalfSuccess == false && status == 401) {
        showerrorsnack("You are not authorised to redeem");
       
      }
       else if (spendOnBehalfSuccess == false && status == 403) {
        showerrorsnack("The redeem code expired!");
       
      }
      
      else {
        showerrorsnack("An unexpected error occurred");
      }

      setProcessing(false);
    }
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

      <p>Enter a destination address to redeem your crypto</p>

      <TextField
        value={receiverAddress}
        onChange={(ev) => setReceiverAddress(ev.target.value)}
        label="Address"
        placeholder="0x. . ."
        fullWidth
        variant="standard"
        autoComplete="off"
        type="text"
        sx={{
          marginTop: "1.25rem",
          "& .MuiInputBase-input": {
            color: colors.textprimary,
          },
          "& .MuiInputLabel-root": {
            color: colors.textsecondary,
          },
          "& .MuiInput-underline:before": {
            borderBottomColor: colors.divider,
          },
          "& .MuiInput-underline:hover:before": {
            borderBottomColor: colors.divider,
          },
          "& .MuiInput-underline:after": {
            borderBottomColor: colors.accent,
          },
        }}
      />

      <button onClick={onSpendOnBehalf}>
        {processing ? (
          <Loading />
        ) : (
          <>
            Send <SendFromToken color={colors.textprimary} />
          </>
        )}
      </button>
    </div>
  );
};
