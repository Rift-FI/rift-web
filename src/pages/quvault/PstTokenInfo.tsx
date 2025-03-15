import { CSSProperties, FC, JSX, ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import {
  faRotate,
  faArrowUpRightFromSquare,
  faCalendarDay,
  faArrowsUpDown,
  faChartPie,
  faArrowUpRightDots,
  faWarehouse,
  faPercent,
  faCalendarDays,
  faArrowRotateLeft,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import {
  LineChart,
  Line,
  XAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
} from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { openLink } from "@telegram-apps/sdk-react";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { useAppDrawer } from "../../hooks/drawer";
import {
  topproduct,
  getTopProducts,
  getTokenOverview,
  getInventoryOverview,
  getTokenSettlement,
  settlement,
} from "../../utils/api/quvault/tokendashboard";
import { SubmitButton } from "../../components/global/Buttons";
import { HorizontalDivider } from "../../components/global/Divider";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import "../../styles/pages/quvault/psttokeninfo.scss";

export default function PstTokenInfo(): JSX.Element {
  const { token, price } = useParams();
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { openAppDrawerWithKey } = useAppDrawer();

  const [filter, setFilter] = useState<"about" | "products" | "sales">("about");

  const { data: tokenOverView } = useQuery({
    queryKey: ["tokenoverview"],
    queryFn: () => getTokenOverview(token as string),
  });

  const { data: inventoryOverView } = useQuery({
    queryKey: ["tokeninventory"],
    queryFn: () => getInventoryOverview(token as string),
  });

  const { data: tokenSettlement } = useQuery({
    queryKey: ["tokensettlement"],
    queryFn: () => getTokenSettlement(token as string),
  });

  const { data: tokenTopProducts } = useQuery({
    queryKey: ["tokenproducts"],
    queryFn: () => getTopProducts(token as string),
  });

  const totalSettlementRatio = tokenSettlement?.data?.reduce(
    (sum, item) => sum + item?.wavg_settlement_ratio,
    0
  );
  const totalRefundRatio = tokenSettlement?.data?.reduce(
    (sum, item) => sum + item?.wavg_refund_ratio,
    0
  );

  const goBack = () => {
    switchtab("earn");
    navigate("/app");
  };

  useBackButton(goBack);

  return (
    <section id="launchpadinfo">
      <div className="about_token">
        <img
          className="token_img"
          src={tokenOverView?.data?.icon_url}
          alt={token}
        />

        <span
          className="link"
          onClick={() => openLink("https://dev.quvault.app/token/amazon.com")}
        >
          {tokenOverView?.data?.real_name}
        </span>

        <p className="desc">
          E-shop that sells large variety of products related to cats, its best
          seller is the automatic cat toilet, experienced 50% YoY growth since
          COVID19.
        </p>
      </div>

      <div className="filters">
        <button
          className={filter == "about" ? "active" : ""}
          onClick={() => setFilter("about")}
        >
          About
        </button>
        <button
          className={filter == "products" ? "active" : ""}
          onClick={() => setFilter("products")}
        >
          Top Products
        </button>
        <button
          className={filter == "sales" ? "active" : ""}
          onClick={() => setFilter("sales")}
        >
          Sales
        </button>
      </div>

      {filter == "about" && (
        <div className="about_token_info">
          <TokenInfo
            imageUrl={tokenOverView?.data?.icon_url as string}
            tokenAddress={tokenOverView?.data?.address as string}
            tokenSymbol={tokenOverView?.data?.symbol as string}
            tokenPrice={Number(price)}
            priceChange={tokenOverView?.data?.rate as number}
          />

          <HorizontalDivider sxstyles={{ margin: "0.625rem 0" }} />

          <div className="details_ctr">
            <TokenDetail
              icon={
                <FaIcon
                  faIcon={faCalendarDay}
                  color={colors.accent}
                  fontsize={18}
                />
              }
              title="Issue Date"
              value={tokenOverView?.data?.offering_date as string}
            />

            <TokenDetail
              icon={
                <FaIcon
                  faIcon={faArrowsUpDown}
                  color={colors.accent}
                  fontsize={18}
                />
              }
              title="Cost Margin"
              value={String(tokenOverView?.data?.cost_margin)}
            />

            <TokenDetail
              icon={
                <FaIcon
                  faIcon={faChartPie}
                  color={colors.accent}
                  fontsize={18}
                />
              }
              title="Market Cap"
              value={String(tokenOverView?.data?.market_cap)}
            />

            <TokenDetail
              icon={
                <FaIcon
                  faIcon={faArrowUpRightDots}
                  color={colors.accent}
                  fontsize={18}
                />
              }
              title="APY"
              value={String(tokenOverView?.data?.apy) + "%"}
            />

            <TokenDetail
              icon={
                <FaIcon
                  faIcon={faCalendarDays}
                  color={colors.accent}
                  fontsize={18}
                />
              }
              title="DIO"
              value={String(
                inventoryOverView?.data?.wavg_dio_all_sku_curr_inv_value || 0
              )}
            />

            <TokenDetail
              icon={
                <FaIcon
                  faIcon={faWarehouse}
                  color={colors.accent}
                  fontsize={18}
                />
              }
              title="Inventory Value"
              value={String(inventoryOverView?.data?.curr_inv_value || 0)}
            />

            <TokenDetail
              icon={
                <FaIcon
                  faIcon={faPercent}
                  color={colors.accent}
                  fontsize={18}
                />
              }
              title="Proportion"
              value={String(
                inventoryOverView?.data?.top_10_proportion_curr_inv_value || 0
              )}
            />

            <TokenDetail
              icon={
                <FaIcon
                  faIcon={faCircleCheck}
                  color={colors.accent}
                  fontsize={18}
                />
              }
              title="Settlement Ratio"
              value={String(
                tokenSettlement?.data?.length == 0
                  ? 0
                  : (
                      Number(totalSettlementRatio) /
                      Number(tokenSettlement?.data?.length)
                    ).toFixed(3)
              )}
            />

            <TokenDetail
              icon={
                <FaIcon
                  faIcon={faArrowRotateLeft}
                  color={colors.accent}
                  fontsize={18}
                />
              }
              title="Refund Ratio"
              value={String(
                tokenSettlement?.data?.length == 0
                  ? 0
                  : (
                      Number(totalRefundRatio) /
                      Number(tokenSettlement?.data?.length)
                    ).toFixed(3)
              )}
            />
          </div>
        </div>
      )}

      {filter == "products" && (
        <>
          {tokenTopProducts?.data?.length == 0 ? (
            <p className="not_available">
              No products available for this token
            </p>
          ) : (
            <div className="products_ctr">
              {tokenTopProducts?.data?.map((_product, index) => (
                <Product
                  key={_product?.sku_dio_12m + index}
                  product={_product}
                />
              ))}
            </div>
          )}
        </>
      )}

      {filter == "sales" && (
        <>
          {tokenSettlement?.data?.length == 0 ? (
            <p className="not_available">
              No sales data available for this token
            </p>
          ) : (
            <SalesChart data={tokenSettlement?.data || []} />
          )}
        </>
      )}

      <div className="submit_ctr">
        <SubmitButton
          text="Swap"
          icon={<FaIcon faIcon={faRotate} color={colors.textprimary} />}
          sxstyles={{
            padding: "0.625rem",
            borderRadius: "1.5rem",
            backgroundColor: colors.success,
          }}
          onclick={() => openAppDrawerWithKey("swappst", token)}
        />
      </div>
    </section>
  );
}

const TokenInfo = ({
  imageUrl,
  tokenSymbol,
  tokenAddress,
  tokenPrice,
  priceChange,
}: {
  imageUrl: string;
  tokenSymbol: string;
  tokenAddress: string;
  tokenPrice: number;
  priceChange: number;
}): JSX.Element => {
  return (
    <div className="tokeninfo">
      <img src={imageUrl} alt={tokenSymbol} />

      <div className="address_price">
        <p
          className="symbol"
          onClick={() =>
            openLink(`https://polygonscan.com/token/${tokenAddress}`)
          }
        >
          {tokenSymbol}
          <FaIcon
            faIcon={faArrowUpRightFromSquare}
            color={colors.textsecondary}
            fontsize={10}
          />
        </p>

        <p className="price">
          {"$" + tokenPrice.toFixed(4)}
          <span>{priceChange + "%"}</span>
        </p>
      </div>
    </div>
  );
};

const TokenDetail = ({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string;
}): JSX.Element => {
  return (
    <div className="token_detail">
      <span className="icon">{icon}</span>
      <p className="det_title">{title}</p>
      <span className="value">{value}</span>
    </div>
  );
};

const Product = ({ product }: { product: topproduct }): JSX.Element => {
  return (
    <div className="top_product">
      <div className="img_sales">
        <img src={product?.image_url} alt={product?.sku} />

        <div className="sales">
          <p>
            Sales (30d) <span>{product?.p30d_sales_amt}</span>
          </p>
          <p>
            Item Rank <span>{product?.rank}</span>
          </p>
        </div>
      </div>

      <p className="sku_desc">
        {product?.sku} <span>{product?.title}</span>
      </p>
    </div>
  );
};

const SalesChart = ({ data }: { data: settlement[] }): JSX.Element => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const CustomTooltip: FC<TooltipProps<ValueType, NameType>> = ({
    active,
    payload,
    label,
  }) => {
    if (!active || !payload || payload.length === 0) return null;

    const dataPoint = payload[0]?.payload as settlement;

    const pstyles: CSSProperties = {
      fontFamily: "'Raleway', Sans-serif",
      fontSize: "0.75rem",
      fontWeight: "bold",
      color: colors.textsecondary,
    };
    const spanstyles: CSSProperties = {
      marginRight: "0.375rem",
      fontFamily: "'Open Sans', serif",
      fontWeight: "300",
    };

    return (
      <div
        style={{
          padding: "0.5rem",
          border: `1px solid ${colors.divider}`,
          borderRadius: "0.375rem",
          background: colors.primary,
        }}
      >
        <p style={pstyles}>{formatDate(label as string)}</p>
        <p style={pstyles}>
          <span style={spanstyles}>Refund Ratio:</span>
          {dataPoint.wavg_refund_ratio.toFixed(2)}
        </p>
        <p style={pstyles}>
          <span style={spanstyles}>Settlement Ratio:</span>
          {dataPoint.wavg_settlement_ratio.toFixed(2)}
        </p>
        <p style={pstyles}>
          <span style={spanstyles}>Daily Sales USD:</span>
          {dataPoint.sales_order_amount.toLocaleString()}
        </p>
      </div>
    );
  };

  return (
    <ResponsiveContainer
      style={{ marginTop: "0.5rem" }}
      width="100%"
      height={400}
    >
      <LineChart data={data}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={colors.divider}
          vertical={false}
        />
        <XAxis
          dataKey="year_month"
          style={{ fontSize: "0.75rem", fontWeight: "bold" }}
          tickFormatter={formatDate}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="sales_order_amount"
          stroke={colors.accent}
          strokeWidth={1.5}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
