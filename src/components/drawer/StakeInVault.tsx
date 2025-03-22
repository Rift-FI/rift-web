import { JSX, useState } from "react";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { OutlinedTextInput } from "../global/Inputs";
import { SubmitButton } from "../global/Buttons";
import { colors } from "../../constants";
import mantralogo from "../../assets/images/labs/mantralogo.jpeg";
import "../../styles/components/drawer/stakeunstakeinvault.scss";

export const StakeInVault = (): JSX.Element => {
  const { showsuccesssnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [procesing, setProcessing] = useState<boolean>(false);
  const [showApproved, setShowApproved] = useState<boolean>(false);
  const [approved, setApproved] = useState<boolean>(false);

  const onApprove = () => {
    setProcessing(true);

    setTimeout(() => {
      showsuccesssnack("Approved successfully, proceed to Staking");
      setApproved(true);
      setProcessing(false);
    }, 3500);
  };

  const onStakeOM = () => {
    setProcessing(true);

    setTimeout(() => {
      setProcessing(false);
      showsuccesssnack(`${stakeAmount} LST added to your balance`);
      closeAppDrawer();
    }, 3500);
  };

  return (
    <div className="stakeinvault">
      <div className="token">
        <p>Token</p>
        <img src={mantralogo} alt="mantra" />
      </div>

      <OutlinedTextInput
        inputType="text"
        inputlabalel="Stake Amount"
        placeholder="100"
        inputState={stakeAmount}
        setInputState={setStakeAmount}
        sxstyles={{ marginTop: "0.75rem" }}
      />

      <div className="balance">
        <p>
          Balance <br />
          <span>200 OM</span>
        </p>

        <button className="max_out" onClick={() => setStakeAmount("200")}>
          Max
        </button>
      </div>

      <p className="receive">
        You'll receive
        <span>{stakeAmount == "" ? 0 : stakeAmount} LST</span>
      </p>

      {showApproved && (
        <div className="approval">
          <p className="msg">
            Approve OM Token
            <span>
              You need to approve the contract to spend your OM tokens.
            </span>
          </p>

          <p className="gas">
            <span>Estimated Gas Fee</span> ~0.001 ETH
          </p>
        </div>
      )}

      <SubmitButton
        text={approved ? "Stake OM" : "Approve"}
        sxstyles={{
          marginTop: "1rem",
          padding: "0.625rem",
          backgroundColor:
            stakeAmount == "" || procesing ? colors.divider : colors.success,
        }}
        isDisabled={stakeAmount == "" || procesing}
        isLoading={procesing}
        onclick={
          approved
            ? onStakeOM
            : showApproved
            ? onApprove
            : () => setShowApproved(true)
        }
      />
    </div>
  );
};
