import { JSX, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { airWlxbalType, UseAirWallexKey } from "../../utils/api/keys";
import { SubmitButton } from "../global/Buttons";
import { Import } from "../../assets/icons/actions";
import { colors } from "../../constants";
import consumekey from "../../assets/images/consumesecret.png";
import "../../styles/components/forms.scss";

export const ConsumeAwxKey = (): JSX.Element => {
  const { closeAppDrawer, keyToshare, secretPurpose } = useAppDrawer(); //keyToshare: secretid, purpose: secretnonce
  const { showerrorsnack } = useSnackbar();

  const [airwlxdata, setairwlxdata] = useState<airWlxbalType[]>([]);

  const { mutate: onConsumeKey, isPending: loading } = useMutation({
    mutationFn: () =>
      UseAirWallexKey(keyToshare as string, secretPurpose as string)
        .then((res) => {
          if (res?.isOk && res?.status == 200) {
            setairwlxdata(res?.airWlx);
          } else {
            showerrorsnack("Sorry, unable to access balances");
            closeAppDrawer();
          }
        })
        .catch(() => {
          showerrorsnack("Sorry, unable to access balances");
          closeAppDrawer();
        }),
  });

  return (
    <div id="consumesharedkey">
      <img src={consumekey} alt="consume key" />

      <p>Use the AirWallex Key to access balances</p>

      {airwlxdata?.length == 0 ? (
        <SubmitButton
          text="Get Airwallex Balances"
          icon={
            <Import
              width={18}
              height={18}
              color={loading ? colors.textsecondary : colors.primary}
            />
          }
          isDisabled={loading}
          isLoading={loading}
          sxstyles={{
            marginTop: "0.5rem",
            padding: "0.625rem",
            borderRadius: "1.5rem",
          }}
          onclick={() => onConsumeKey()}
        />
      ) : (
        <div className="airwallx">
          <p>
            <span>Currency</span> {airwlxdata[0]?.currency}
          </p>
          <p>
            <span>Available Amount</span> {airwlxdata[0]?.available_amount}
          </p>
          <p>
            <span>Pending Amount</span> {airwlxdata[0]?.pending_amount}
          </p>
          <p>
            <span>Reserved Amount</span> {airwlxdata[0]?.reserved_amount}
          </p>
          <p>
            <span>Total Amount</span> {airwlxdata[0]?.total_amount}
          </p>
        </div>
      )}
    </div>
  );
};
