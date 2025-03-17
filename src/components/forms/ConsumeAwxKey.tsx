import { JSX, useCallback, useState } from "react";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { airWlxbalType, UseKeyFromSecret } from "../../utils/api/keys";
import { SubmitButton } from "../global/Buttons";
import { Import } from "../../assets/icons/actions";
import { colors } from "../../constants";
import consumekey from "../../assets/images/consumesecret.png";
import "../../styles/components/forms.scss";

export const ConsumeAwxKey = (): JSX.Element => {
  const { closeAppDrawer, linkUrl } = useAppDrawer();
  const { showerrorsnack } = useSnackbar();

  const [loading, setLoading] = useState<boolean>(false);
  const [airwlxdata, setairwlxdata] = useState<airWlxbalType[]>([]);

  const onConsumeKey = useCallback(async () => {
    setLoading(true);

    const parsedUrl = new URL(linkUrl as string);
    const params = parsedUrl.searchParams;
    const scrtId = params.get("id");
    const scrtNonce = params.get("nonce");

    const { isOk, status, airWlx } = await UseKeyFromSecret(
      scrtId as string,
      scrtNonce as string
    );

    if (isOk && status == 200) {
      localStorage.removeItem("scId");
      localStorage.removeItem("scNonce");

      setairwlxdata(airWlx);
    } else {
      showerrorsnack("Sorry, unable to access balances");
      closeAppDrawer();
    }

    setLoading(false);
  }, []);

  return (
    <div id="consumesharedkey">
      <img src={consumekey} alt="consume key" />

      <p>Use the AirWallex Key to access balances</p>

      {airwlxdata.length == 0 ? (
        <SubmitButton
          text="Get Airwallex Balances"
          icon={<Import width={18} height={18} color={colors.textprimary} />}
          isDisabled={loading}
          isLoading={loading}
          sxstyles={{
            marginTop: "0.5rem",
            padding: "0.625rem",
            borderRadius: "1.5rem",
            backgroundColor: colors.success,
          }}
          onclick={onConsumeKey}
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
