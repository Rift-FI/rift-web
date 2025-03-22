import { JSX, useState } from "react";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { OutlinedTextInput } from "../global/Inputs";
import { SubmitButton } from "../global/Buttons";
import { Warning } from "../../assets/icons/actions";
import { colors } from "../../constants";
import staketoken from "../../assets/images/icons/lendto.png";
import "../../styles/components/drawer/stakeunstakeinvault.scss";

export const UnStakeFromVault = (): JSX.Element => {
  const { showsuccesssnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  const [unstakeAmount, setUnstakeAmount] = useState<string>("");
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [procesing, setProcessing] = useState<boolean>(false);

  const onConfirm = () => {
    setConfirmed(true);
  };

  const onUnstake = () => {
    setProcessing(true);

    setTimeout(() => {
      showsuccesssnack("You tokens will be available in 7 days");
      closeAppDrawer();
    }, 3500);
  };

  return (
    <div className="unstakefromvault">
      <div className="token">
        <p>Token</p>
        <img src={staketoken} alt="LST" />
      </div>

      <OutlinedTextInput
        inputType="text"
        inputlabalel="Unstake Amount"
        placeholder="100"
        inputState={unstakeAmount}
        setInputState={setUnstakeAmount}
        sxstyles={{ marginTop: "0.75rem" }}
      />

      <div className="balance">
        <p>
          Balance <br />
          <span>100 LST</span>
        </p>

        <button className="max_out" onClick={() => setUnstakeAmount("100")}>
          Max
        </button>
      </div>

      <div className="warn">
        <Warning width={18} height={20} color={colors.danger} />
        <span>A 7-day cooldown period applies to all unstaking requests.</span>
      </div>

      {confirmed ? (
        <div className="confirm_unstake">
          <p className="msg">
            Confirm Unstaking
            <span>
              You are about to start the unstaking process for 100 LST
            </span>
          </p>

          <div className="warn">
            <Warning width={18} height={20} color={colors.danger} />
            <span>
              Your tokens will be locked for 7 days before you can withdraw
              them.
            </span>
          </div>
        </div>
      ) : (
        <div className="requests">
          <p className="title">Active Unstaking Requests</p>

          <p className="remainder">
            <span className="unlocking">50 LST Unlocking</span>
            <span>3 days left</span>
          </p>

          <div className="progress">
            <div />
          </div>

          <p className="start_unlocked">
            <span>Started</span>
            <span>Unlocked</span>
          </p>
        </div>
      )}

      <SubmitButton
        text={confirmed ? "Confirm" : "Start Unstaking"}
        sxstyles={{
          marginTop: "1rem",
          padding: "0.625rem",
          backgroundColor:
            unstakeAmount == "" || procesing ? colors.divider : colors.success,
        }}
        isDisabled={unstakeAmount == "" || procesing}
        isLoading={procesing}
        onclick={confirmed ? onUnstake : onConfirm}
      />
    </div>
  );
};
