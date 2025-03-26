import { JSX, MouseEvent, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  faLayerGroup,
  faCalendarDay,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { addDays } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { useSnackbar } from "../../hooks/snackbar";
import { formatDateToStr } from "../../utils/dates";
import { fetchMyKeys } from "../../utils/api/keys";
import { getStakingInfo, stakeLST } from "../../utils/api/staking";
import { SubmitButton } from "../../components/global/Buttons";
import { BottomButtonContainer } from "../../components/Bottom";
import { CurrencyPopOver, PopOver } from "../../components/global/PopOver";
import { assetType } from "../lend/CreateLendAsset";
import { sphereVaults, techgrityProducts } from "../../components/tabs/Defi";
import { HorizontalDivider } from "../../components/global/Divider";
import { APYChart } from "./StakeVault";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import wusdlogo from "../../assets/images/wusd.png";
import mantralogo from "../../assets/images/labs/mantralogo.jpeg";
import airwallexlogo from "../../assets/images/awx.png";
import "../../styles/pages/transactions/stakecrypto.scss";

export default function StakeTokens(): JSX.Element {
  const navigate = useNavigate();
  const { srctoken } = useParams();
  const { switchtab } = useTabs();
  const { showerrorsnack, showsuccesssnack } = useSnackbar();

  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [stakeCurrency, setStakeCurrency] = useState<assetType>("USDC");
  const [currencyAnchorEl, setCurrencyAnchorEl] =
    useState<HTMLDivElement | null>(null);
  const [keysAnchorEl, setKeysAnchorEl] = useState<HTMLDivElement | null>(null);
  const [selectKeyValue, setSelectKeyValue] = useState<string | null>(null);

  const selecttoken = srctoken?.startsWith("st")
    ? sphereVaults.find((token) => token?.id === srctoken)
    : techgrityProducts.find((token) => token?.id === srctoken);
  const currentDate = new Date();
  const nextDay = addDays(currentDate, 1);

  const { data: mykeys } = useQuery({
    queryKey: ["secrets"],
    queryFn: fetchMyKeys,
  });

  const myairwallexkeys = mykeys?.filter(
    (_key) => _key?.purpose == "AIRWALLEX"
  );

  const stakingintent = localStorage.getItem("stakeintent");

  const goBack = () => {
    if (stakingintent !== null) {
      localStorage.removeItem("stakeintent");
    }

    switchtab("earn");
    navigate("/app");
  };

  const onSelectKey = (e: MouseEvent<HTMLDivElement>) => {
    if (Number(myairwallexkeys?.length) > 0) {
      setKeysAnchorEl(e.currentTarget);
    } else {
      showerrorsnack(`Import an Airwallex Key to stake with ${stakeCurrency}`);
    }
  };

  const { data: stakinginfo } = useQuery({
    queryKey: ["stakinginfo"],
    queryFn: getStakingInfo,
  });

  const { mutate: onSubmitStake, isPending } = useMutation({
    mutationFn: () =>
      stakeLST(Number(stakeAmount), stakingintent == null ? "stake" : "unlock")
        .then(() => {
          localStorage.removeItem("stakeintent");
          setStakeAmount("");
          showsuccesssnack(`Succeesffully staked ${stakeAmount} USDC`);
        })
        .catch(() => {
          showerrorsnack("Failed to stake, please try again");
        }),
  });

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
          <div className="crypto_selector" onClick={() => {}}>
            {stakeCurrency == "HKD" || stakeCurrency == "HKDA" ? (
              "🇭🇰"
            ) : stakeCurrency == "USD" ? (
              "🇺🇸"
            ) : (
              <img
                src={
                  stakeCurrency == "BTC"
                    ? btclogo
                    : stakeCurrency == "ETH"
                    ? ethlogo
                    : stakeCurrency == "OM"
                    ? mantralogo
                    : stakeCurrency == "USDC"
                    ? usdclogo
                    : wusdlogo
                }
                alt="stake-token"
              />
            )}
          </div>
          <CurrencyPopOver
            anchorEl={currencyAnchorEl}
            setAnchorEl={setCurrencyAnchorEl}
            setCurrency={setStakeCurrency}
          />
          <button className="max_out" onClick={() => setStakeAmount(String(0))}>
            Max
          </button>
        </div>
      </div>

      <p className="available_balance">
        Available Balance&nbsp;
        <span>0 {selecttoken?.name?.split(" ").join("")}</span>
      </p>

      {stakeCurrency == "HKD" || stakeCurrency == "USD" ? (
        <>
          <div className="source_key" onClick={onSelectKey}>
            <img src={airwallexlogo} alt="AirWallex" />
            <p>
              Choose an AirWallex Key
              <span>
                {selectKeyValue == null
                  ? `You have ${myairwallexkeys?.length || 0} AirWallex Key(s)`
                  : selectKeyValue?.substring(0, selectKeyValue.length / 2.5) +
                    "..."}
              </span>
            </p>
          </div>
          <PopOver anchorEl={keysAnchorEl} setAnchorEl={setKeysAnchorEl}>
            <div className="select_secrets">
              {myairwallexkeys?.map((_key) => (
                <div
                  className="img_desc"
                  key={_key?.id}
                  onClick={() => {
                    setSelectKeyValue(_key?.value);
                    setKeysAnchorEl(null);
                  }}
                >
                  <img src={airwallexlogo} alt="secret" />

                  <p className="desc">
                    AIRWALLEX <br />
                    <span>
                      {_key?.value?.substring(0, _key?.value?.length / 2.5) +
                        "..."}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </PopOver>
        </>
      ) : (
        <div className="info_stable">
          <FaIcon faIcon={faInfoCircle} color={colors.danger} fontsize={12} />
          <span>Supporting other stablecoins, crypto & fiat soon</span>
        </div>
      )}

      <div className="receive_ctr">
        <p>
          Receive
          <span>{stakeAmount == "" ? 0 : stakeAmount} LST</span>
        </p>

        <p>
          Conversion Ratio
          <span>1 {stakeCurrency} ≈ 1 LST</span>
        </p>

        <p>
          Lock Period <span>30 days</span>
        </p>

        <p>
          Cooldown Period <span>7 days</span>
        </p>

        <p>
          TVL <span>${stakinginfo?.data?.totalStaked || 0}</span>
        </p>

        <p className="l_token">
          APY <span>11%</span>
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
                fontsize={14}
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
                fontsize={14}
              />
            </span>
            Start Earning
          </p>

          {formatDateToStr(nextDay.toString(), true)}
        </div>
      </div>
      <HorizontalDivider sxstyles={{ margin: "0.875rem 0" }} />

      <APYChart
        legendTitle={`${
          typeof selecttoken == "undefined" ? "Buffet" : selecttoken?.name
        } APY`}
      />

      <BottomButtonContainer>
        <SubmitButton
          text="Stake"
          icon={
            <FaIcon
              faIcon={faLayerGroup}
              color={
                stakeAmount == "" || isPending
                  ? colors.textsecondary
                  : colors.textprimary
              }
            />
          }
          isLoading={isPending}
          isDisabled={stakeAmount == "" || isPending}
          sxstyles={{
            padding: "0.625rem",
            borderRadius: "1.5rem",
            backgroundColor:
              stakeAmount == "" || isPending ? colors.divider : colors.success,
          }}
          onclick={onSubmitStake}
        />
      </BottomButtonContainer>
    </section>
  );
}
