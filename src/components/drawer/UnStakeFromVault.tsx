import { JSX, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import {
  getStakeingBalance,
  getStakingInfo,
  unstakeLST,
} from "../../utils/api/staking";
import { OutlinedTextInput } from "../global/Inputs";
import { SubmitButton } from "../global/Buttons";
import { Warning } from "../../assets/icons/actions";
import { colors } from "../../constants";
import staketoken from "../../assets/images/labs/usdc.png";
import "../../styles/components/drawer/stakeunstakeinvault.scss";

export const UnStakeFromVault = (): JSX.Element => {
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  const [unstakeAmount, setUnstakeAmount] = useState<string>("");
  const [confirmed, setConfirmed] = useState<boolean>(false);

  const onConfirm = () => {
    setConfirmed(true);
  };

  const { data: stakinginfo, isPending: stakinginfoloading } = useQuery({
    queryKey: ["stakinginfo"],
    queryFn: getStakingInfo,
  });

  const { data: stakingbalance, isFetching: stakingbalanceloading } = useQuery({
    queryKey: ["stkingbalance"],
    queryFn: getStakeingBalance,
  });

  const { mutate: onUnstake, isPending } = useMutation({
    mutationFn: () =>
      unstakeLST(unstakeAmount)
        .then((res) => {
          if (res?.success && res?.data?.transactionHash) {
            showsuccesssnack(
              `Successfully initiated unstaking for ${unstakeAmount} USDC`
            );
            closeAppDrawer();
          }
        })
        .catch(() => {
          showerrorsnack("Failed to unstake, please try again");
        }),
  });

  const convertTime = (seconds: number) => {
    let days = Math.floor(seconds / (24 * 60 * 60));
    seconds %= 24 * 60 * 60;

    let hours = Math.floor(seconds / (60 * 60));
    seconds %= 60 * 60;

    let minutes = Math.floor(seconds / 60);
    seconds %= 60;

    return `${days} days, ${hours} hours, ${minutes} minutes`;
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
          <span>
            {Math.round(Number(stakingbalance?.data?.lstBalance))}{" "}
            {stakinginfo?.data?.tokenSymbol || "LST"}
          </span>
        </p>

        <button
          className="max_out"
          onClick={() =>
            setUnstakeAmount(
              String(Math.round(Number(stakingbalance?.data?.lstBalance)))
            )
          }
        >
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
            <span className="unlocking">
              {stakingbalance?.data?.withdrawalRequest?.amount}{" "}
              {stakinginfo?.data?.tokenSymbol || "LST"} Unlocking
            </span>
            <span>
              in&nbsp;
              {stakingbalance?.data?.withdrawalRequest?.amount !== "0.0" &&
                convertTime(
                  Number(
                    stakingbalance?.data?.withdrawalRequest?.cooldownRemaining
                  )
                )}
            </span>
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
            unstakeAmount == "" ||
            isPending ||
            stakinginfoloading ||
            stakingbalanceloading
              ? colors.divider
              : colors.success,
        }}
        isDisabled={
          unstakeAmount == "" ||
          isPending ||
          stakinginfoloading ||
          stakingbalanceloading
        }
        isLoading={isPending}
        onclick={confirmed ? onUnstake : onConfirm}
      />
    </div>
  );
};
