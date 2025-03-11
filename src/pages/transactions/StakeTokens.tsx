import { JSX, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { faLayerGroup, faCalendarDay } from "@fortawesome/free-solid-svg-icons";
import { addDays } from "date-fns";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { useSnackbar } from "../../hooks/snackbar";
import { formatDateToStr } from "../../utils/dates";
import { CryptoPopOver } from "../../components/global/PopOver";
import { SubmitButton } from "../../components/global/Buttons";
import { sphereVaults, techgrityProducts } from "../../components/tabs/Defi";
import { HorizontalDivider } from "../../components/global/Divider";
import { assetType } from "../lend/CreateLendAsset";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import wusdlogo from "../../assets/images/wusd.png";
import "../../styles/pages/transactions/stakecrypto.scss";

export default function StakeTokens(): JSX.Element {
  const navigate = useNavigate();
  const { srctoken } = useParams();
  const { switchtab } = useTabs();
  const { showerrorsnack } = useSnackbar();

  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [tokenAnchorEl, setTokenAnchorEl] = useState<HTMLDivElement | null>(
    null
  );
  const [_token, setToken] = useState<Exclude<assetType, "USD" | "HKD">>("OM");

  const selecttoken = srctoken?.startsWith("st")
    ? sphereVaults.find((token) => token?.id === srctoken)
    : techgrityProducts.find((token) => token?.id === srctoken);
  const currentDate = new Date();
  const nextDay = addDays(currentDate, 1);

  const onSubmitStake = () => {
    showerrorsnack("Staking coming soon...");
  };

  const goBack = () => {
    switchtab("earn");
    navigate("/app");
  };

  useBackButton(goBack);

  return (
    <section id="staketokens">
      <p className="title">Stake Amount</p>

      <div className="input_ctr">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Minimum 0.001"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
        />

        <div className="selector_maxout">
          <div
            className="crypto_selector"
            onClick={(e) => setTokenAnchorEl(e.currentTarget)}
          >
            <img src={wusdlogo} alt="select token" />
          </div>
          <button className="max_out" onClick={() => setStakeAmount(String(0))}>
            Max
          </button>
        </div>
        <CryptoPopOver
          anchorEl={tokenAnchorEl}
          setAnchorEl={setTokenAnchorEl}
          setCurrency={setToken}
        />
      </div>

      <p className="available_balance">
        Available Balance{" "}
        <span>0 {selecttoken?.name?.split(" ").join("")}</span>
      </p>

      <div className="receive_ctr">
        <p>
          Receive <span>0.125 st{selecttoken?.name?.split(" ").join("")}</span>
        </p>

        <p>
          Conversion Ratio
          <span>
            1 {selecttoken?.name?.split(" ").join("")} ≈ 1 st
            {selecttoken?.name?.split(" ").join("")}
          </span>
        </p>

        <p>
          Lock Period <span>{selecttoken?.lockPeriod}</span>
        </p>

        <p>
          Cooldown Period <span>7 days</span>
        </p>

        <p>
          TVL <span>{selecttoken?.currentTvl}</span>
        </p>

        <p className="l_token">
          APR <span>{selecttoken?.apy}</span>
        </p>
      </div>

      <HorizontalDivider sxstyles={{ marginTop: "0.875rem" }} />
      <div className="info">
        <div className="info_ctr">
          <p>
            <span>
              <FaIcon
                faIcon={faCalendarDay}
                color={colors.textprimary}
                fontsize={12}
              />
            </span>
            Stake Date
          </p>

          {formatDateToStr(currentDate.toString())}
        </div>

        <div className="info_ctr">
          <p>
            <span>
              <FaIcon
                faIcon={faCalendarDay}
                color={colors.textprimary}
                fontsize={12}
              />
            </span>
            Start Earning Rewards
          </p>

          {formatDateToStr(nextDay.toString(), true)}
        </div>
      </div>
      <HorizontalDivider sxstyles={{ marginTop: "0.875rem" }} />

      <div className="description">
        <p>
          <span>Stake:</span> Deposit your crypto assets into our secure staking
          pool to start earning passive rewards.
        </p>
        <p>
          <span>Earn LST:</span> Receive liquid staking tokens (LST) that
          represent your staked assets and can be used in DeFi for additional
          yield opportunities.
        </p>
        <p>
          <span>Rebase:</span> Watch your LST balance automatically adjust to
          reflect staking rewards.
        </p>
        <p>
          <span>Unstake:</span> Redeem your staked assets whenever you’re ready
          to exit the staking process.
        </p>
        <p>
          <span>Withdraw:</span> Withdraw your original stake and accumulated
          rewards with ease.
        </p>
      </div>

      <div className="btn_ctr">
        <SubmitButton
          text="Stake"
          icon={
            <FaIcon
              faIcon={faLayerGroup}
              color={
                stakeAmount == "" ? colors.textsecondary : colors.textprimary
              }
            />
          }
          isDisabled={stakeAmount == ""}
          sxstyles={{ padding: "0.625rem", borderRadius: "0.375rem" }}
          onclick={onSubmitStake}
        />
      </div>
    </section>
  );
}
