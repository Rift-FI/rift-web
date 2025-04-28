import { JSX, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, Legend } from "recharts";
import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { useTabs } from "../../hooks/tabs";
import { useBackButton } from "../../hooks/backbutton";
import { useSnackbar } from "../../hooks/snackbar";
import {
  getLaunchPadStores,
  launchPadStoreSubscribe,
} from "../../utils/api/quvault/launchpad";
import { formatDateToStr } from "../../utils/dates";
import { getPstTokenBalance } from "../../utils/api/quvault/psttokens";
import { SubmitButton } from "../../components/global/Buttons";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import "../../styles/pages/quvault/launchpadinfo.scss";

export type tokenomic = { name: string; value: number; color: string };

export default function LaunchPadInfo(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const { showerrorsnack, showsuccesssnack } = useSnackbar();

  const [subScribeAmount, setSubscribeAmount] = useState<string>("");

  const { data: launchPaddata } = useQuery({
    queryKey: ["launchpad"],
    queryFn: getLaunchPadStores,
  });

  const selectstore = launchPaddata?.data?.find((_store) => _store?.id == id);

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  const { data: pstBalance, isFetching: pstBalLoading } = useQuery({
    queryKey: ["tokenbalance"],
    queryFn: () => getPstTokenBalance(selectstore?.token_address as string),
  });

  const { mutate: initStoreSubscribe, isPending: subscribeLoading } =
    useMutation({
      mutationFn: () =>
        launchPadStoreSubscribe(id as string, Number(subScribeAmount)),
      onMutate: () => {
        showsuccesssnack(
          `Please wait, subscribing to ${selectstore?.symbol.substring(
            0,
            selectstore?.symbol.length / 2
          )}...`
        );
      },
      onSuccess: (res) => {
        if (res?.status == 400) {
          showerrorsnack("An error occurred, Insufficient Balance.");
        } else {
          showsuccesssnack(
            `Successfully subscribed to ${selectstore?.symbol.substring(
              0,
              selectstore?.symbol.length / 2
            )}...`
          );
        }
      },
    });

  const tokenomicsdata: tokenomic[] = [
    {
      name: "Presale",
      value: selectstore?.presale_percentage as number,
      color: "#E66A4E",
    },
    {
      name: "Liquidity",
      value: selectstore?.liquidity_percentage as number,
      color: "#2CA59D",
    },
    {
      name: "Merchant",
      value: selectstore?.merchant_percentage as number,
      color: "#1F3B4D",
    },
  ];

  useBackButton(goBack);

  return (
    <section id="launchpadinfo">
      <div className="img_name">
        <img src={selectstore?.logo_url} alt={selectstore?.store_name} />

        <p>
          {selectstore?.store_name} <span>{selectstore?.merchant_email}</span>
        </p>
      </div>

      <div className="chart_ctr">
        <TokenomicsChart data={tokenomicsdata} />
      </div>

      <div className="storedetail">
        <p className="detail">
          Symbol <span>{selectstore?.symbol}</span>
        </p>
        <p className="detail">
          Decimals <span>18</span>
        </p>
        <p className="detail">
          Blockchain <span>{selectstore?.blockchain}</span>
        </p>
        <p className="detail">
          Price <span>${selectstore?.price}</span>
        </p>
        <p className="detail">
          Total Supply <span>{selectstore?.total_supply}</span>
        </p>
        <p className="detail">
          Offered At
          <span>{formatDateToStr(selectstore?.offered_at as string)}</span>
        </p>
        <p className="detail">
          Presale% <span>{selectstore?.presale_percentage}%</span>
        </p>
        <p className="detail">
          Liquidity% <span>{selectstore?.liquidity_percentage}%</span>
        </p>
        <p className="detail">
          Merchant% <span>{selectstore?.merchant_percentage}%</span>
        </p>
        <p className="detail">
          APY <span>{selectstore?.apy}%</span>
        </p>
        <p className="detail">
          Margin% <span>{selectstore?.margin_percentage}%</span>
        </p>
        <p className="detail">
          Unlocking Condition <span>{selectstore?.unlocking_condition}%</span>
        </p>
        <p className="detail">
          Reversal Condition <span>{selectstore?.reversal_condition}</span>
        </p>
      </div>

      <div className="input_submit">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Amount 0.5"
          value={subScribeAmount}
          onChange={(e) => setSubscribeAmount(e.target.value)}
        />
        <SubmitButton
          text="Subscribe"
          icon={
            <FaIcon
              faIcon={faCirclePlus}
              color={
                subScribeAmount == "" ||
                pstBalLoading ||
                Number(subScribeAmount) >= Number(pstBalance?.data)
                  ? colors.textsecondary
                  : colors.primary
              }
            />
          }
          sxstyles={{
            marginTop: "0.5rem",
            padding: "0.625rem",
            borderRadius: "0.375rem",
          }}
          isDisabled={
            subScribeAmount == "" ||
            pstBalLoading ||
            Number(subScribeAmount) >= Number(pstBalance?.data) ||
            subscribeLoading
          }
          isLoading={subscribeLoading}
          onclick={() => initStoreSubscribe()}
        />
      </div>
    </section>
  );
}

export const TokenomicsChart = ({
  data,
}: {
  data: tokenomic[];
}): JSX.Element => {
  return (
    <PieChart width={300} height={250}>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={70}
        outerRadius={90}
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
        ))}
      </Pie>
      <Legend
        verticalAlign="bottom"
        align="center"
        iconSize={10}
        iconType="circle"
      />
    </PieChart>
  );
};
