import { JSX, useCallback, useState } from "react";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { airWlxbalType, UseKeyFromSecret } from "../../utils/api/keys";
import { Loading } from "../../assets/animations";
import { Import } from "../../assets/icons";
import { colors } from "../../constants";
import consumekey from "../../assets/images/consumesecret.png";
import "../../styles/components/forms.css";

export const ConsumeSharedKey = (): JSX.Element => {
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  const [loading, setLoading] = useState<boolean>(false);
  const [airwlxdata, setairwlxdata] = useState<airWlxbalType[]>([]);

  const onConsumeKey = useCallback(async () => {
    setLoading(true);

    const secret_id = localStorage.getItem("scId");
    const secret_nonce = localStorage.getItem("scNonce");

    const { isOk, status, airWlx } = await UseKeyFromSecret(
      secret_id as string,
      secret_nonce as string
    );

    if (isOk && status == 200) {
      localStorage.removeItem("scId");
      localStorage.removeItem("scNonce");

      setairwlxdata(airWlx);
      showsuccesssnack("AirWallex API, it worked...");
    } else if (isOk && status == 400) {
      showerrorsnack("Your link has expired...");
      closeAppDrawer();
    } else {
      showerrorsnack("An unexpected error occurred...");
      closeAppDrawer();
    }

    setLoading(false);
  }, []);

  return (
    <div id="consumesharedkey">
      <img src={consumekey} alt="consume key" />

      <p>Use shared key</p>

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
