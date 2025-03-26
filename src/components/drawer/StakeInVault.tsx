import { JSX, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { stakeLST } from "../../utils/api/staking";
import { OutlinedTextInput } from "../global/Inputs";
import { SubmitButton } from "../global/Buttons";
import { colors } from "../../constants";
import usdclogo from "../../assets/images/labs/usdc.png";
import "../../styles/components/drawer/stakeunstakeinvault.scss";

export const StakeInVault = (): JSX.Element => {
  const { showerrorsnack, showsuccesssnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [showApproved, setShowApproved] = useState<boolean>(false);
  const [approved, setApproved] = useState<boolean>(false);

  const onApprove = () => {
    setTimeout(() => {
      showsuccesssnack("Approved successfully, proceed to Staking");
      setApproved(true);
    }, 3500);
  };

  const { mutate: onSubmitStake, isPending } = useMutation({
    mutationFn: () =>
      stakeLST(Number(stakeAmount))
        .then(() => {
          setStakeAmount("");
          showsuccesssnack(`Succeesffully staked ${stakeAmount} USDC`);
          closeAppDrawer();
        })
        .catch(() => {
          showerrorsnack("Failed to stake, please try again");
        }),
  });

  return (
    <div className="stakeinvault">
      <div className="token">
        <p>Token</p>
        <img src={usdclogo} alt="mantra" />
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
          <span>200 USDC</span>
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
            Approve USDC Token
            <span>
              You need to approve the contract to spend your USDC tokens.
            </span>
          </p>

          <p className="gas">
            <span>Estimated Gas Fee</span> ~0.001 ETH
          </p>
        </div>
      )}

      <SubmitButton
        text={approved ? "Stake USDC" : "Approve"}
        sxstyles={{
          marginTop: "1rem",
          padding: "0.625rem",
          backgroundColor:
            stakeAmount == "" || isPending ? colors.divider : colors.success,
        }}
        isDisabled={stakeAmount == "" || isPending}
        isLoading={isPending}
        onclick={
          approved
            ? onSubmitStake
            : showApproved
            ? onApprove
            : () => setShowApproved(true)
        }
      />
    </div>
  );
};
