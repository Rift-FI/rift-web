import { JSX } from "react";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { SubmitButton } from "../global/Buttons";
import { colors } from "../../constants";
import { FaIcon } from "../../assets/faicon";
import "../../styles/components/drawer/claimlendcryptolink.scss";

export const ClaimLendCryptoLink = (): JSX.Element => {
  return (
    <div className="claimlendcryptolink">
      <p className="p0">
        You have received a lent crypto <span>'STAKING'</span> asset
      </p>

      <SubmitButton
        text="Claim"
        icon={<FaIcon faIcon={faCheckCircle} color={colors.primary} />}
        sxstyles={{
          marginTop: "2.5rem",
          padding: "0.625rem",
          borderRadius: "1.5rem",
        }}
        onclick={() => {}}
      />

      <p className="desc">
        Please note that you will only be able to use it for the intended
        purpose <span>'STAKING'</span>. This was set by the sender.
      </p>
    </div>
  );
};
