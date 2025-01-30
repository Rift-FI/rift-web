import { JSX, useCallback, useState } from "react";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { airWlxbalType, UseKeyFromSecret } from "../../utils/api/keys";
import { Loading } from "../../assets/animations";
import { Import } from "../../assets/icons";
import { colors } from "../../constants";
import consumekey from "../../assets/images/consumesecret.png";
import "../../styles/components/forms.scss";

// use shared airwallex key
export const ConsumeSharedKey = (): JSX.Element => {
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { closeAppDrawer, linkUrl } = useAppDrawer();

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
      showsuccesssnack("AirWallex API, it worked...");
    } else {
      showerrorsnack("Sorry, the secret has expired...");
      closeAppDrawer();
    }

    setLoading(false);
  }, []);

  return (
    <div id="consumesharedkey">
      <img src={consumekey} alt="consume key" />

      <p>Use your shared secret to access AirWallex balances</p>

      <button disabled={loading} onClick={onConsumeKey}>
        {loading ? (
          <Loading width="1.5rem" height="1.5rem" />
        ) : (
          <>
            Use Shared Secret
            <Import width={18} height={18} color={colors.textprimary} />
          </>
        )}
      </button>

      {airwlxdata.length > 0 && (
        <div className="airwallx">
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
          <p>
            <span>Currency</span> {airwlxdata[0]?.currency}
          </p>
        </div>
      )}
    </div>
  );
};
