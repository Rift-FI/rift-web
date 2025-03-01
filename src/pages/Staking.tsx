import { JSX } from "react";
import { useNavigate } from "react-router";
import { stakeproducttype, yieldtokentype } from "../types/earn";
import { useBackButton } from "../hooks/backbutton";
import { useTabs } from "../hooks/tabs";
import { formatUsd } from "../utils/formatters";
import { MantraButton, SubmitButton } from "../components/global/Buttons";
import dollar from "../assets/icons/dollar.svg";
import { Lock } from "../assets/icons/actions";
import { colors } from "../constants";
import friendsduel from "../assets/images/labs/friendsduel.png";
import "../styles/pages/staking.scss";

export default function Staking(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  useBackButton(goBack);

  return (
    <section id="staking">
      {products.map((product, index) => (
        <StakingProduct key={index} product={product} />
      ))}

      <div className="yield_tokens">
        {yieldstakingtokens?.map((product, index) => (
          <YieldStakingProduct key={index} product={product} />
        ))}
      </div>

      <p className="section_title">Yield Tokens</p>
      <div className="yield_tokens">
        {yieldtokens?.map((product, index) => (
          <YieldStakingProduct key={index} product={product} />
        ))}
      </div>
    </section>
  );
}

const StakingProduct = ({
  product,
}: {
  product: stakeproducttype;
}): JSX.Element => {
  return (
    <div className="stakeproduct">
      <p className="subject_title">
        Product <span> · {product?.name}</span>
      </p>

      <div className="img_ctr">
        <img src={dollar} alt="fiat" />
      </div>

      <p className="sub">APY</p>
      <p className="title">{product.apy}</p>

      <div className="value">
        <p>
          Current TVL <span>{product.currentTvl}</span>
        </p>
        <p className="last-child">
          Max Capacity <span>{product.maxCapacity}</span>
        </p>
      </div>

      <p className="network">
        Network <span>{product.network}</span>
      </p>

      <MantraButton
        text="Start Earning"
        sxstyles={{ padding: "0.5rem" }}
        onclick={() => {}}
      />
    </div>
  );
};

const YieldStakingProduct = ({
  product,
}: {
  product: yieldtokentype;
}): JSX.Element => {
  return (
    <div className="stake">
      <div className="stakedetails">
        <img src={friendsduel} alt="friendsduel" />

        <div>
          <p className="token_name">
            {product?.name}
            <span>
              {product?.apy}% APY ·&nbsp;
              <em>{product?.hasMonthlyDividend ? "Monthly Dividend" : ""}</em>
            </span>
          </p>

          <p className="min_deposit">
            {formatUsd(product?.minDeposit || 0)} <span>Minimum Deposit</span>
          </p>

          <p className="lockup">
            <Lock width={10} height={12} color={colors.textprimary} />
            {product?.minLockPeriod || 0} Months Lockup Period
          </p>
        </div>
      </div>

      <SubmitButton
        text="Stake Now"
        sxstyles={{
          padding: "0.5rem",
          backgroundColor: colors.divider,
          color: colors.textprimary,
        }}
        onclick={() => {}}
      />
    </div>
  );
};

const products: stakeproducttype[] = [
  {
    name: "Super Senior",
    apy: "Fixed (11%)",
    currentTvl: "$22,698,886.84",
    maxCapacity: "$26,000,000",
    network: "Mantra",
  },
  {
    name: "Junior",
    apy: "Variable (15%)",
    currentTvl: "$22,698,886.84",
    maxCapacity: "$26,000,000",
    network: "Mantra",
  },
];

const yieldstakingtokens: yieldtokentype[] = [
  {
    name: "ESHOP / USDC LP",
    apy: 12,
    hasMonthlyDividend: true,
    minDeposit: 200,
    minLockPeriod: 12,
  },
  {
    name: "ESHOP / USDC LP",
    apy: 30,
    hasMonthlyDividend: true,
    minDeposit: 100,
    minLockPeriod: 12,
  },
  {
    name: "ESHOP / USDC LP",
    apy: 73,
    hasMonthlyDividend: true,
    minDeposit: 100,
    minLockPeriod: 12,
  },
];

const yieldtokens: yieldtokentype[] = [
  {
    name: "ESHOP",
    apy: 10,
    hasMonthlyDividend: true,
    minDeposit: 200,
    minLockPeriod: null,
  },
  {
    name: "ESHOP / USDC LP",
    apy: 15,
    hasMonthlyDividend: true,
    minDeposit: 100,
    minLockPeriod: null,
  },
];
