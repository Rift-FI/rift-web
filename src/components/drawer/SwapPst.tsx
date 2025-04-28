import { JSX, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import {
  getPstTokenOverview,
  getPstTokenBalance,
  getSwapTokenEstimates,
  swapPSTTokens,
} from "../../utils/api/quvault/psttokens";
import { formatNumber } from "../../utils/formatters";
import { SubmitButton } from "../global/Buttons";
import { Loading } from "../../assets/animations";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import usdclogo from "../../assets/images/labs/usdc.png";
import defaulttokenlogo from "../../assets/images/icons/lendto.png";
import "../../styles/components/drawer/swappst.scss";

export const SwapPst = (): JSX.Element => {
  const queryclient = useQueryClient();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { keyToshare } = useAppDrawer(); // keyToshare -> token symbol ... secretPurpose -> token price

  const [sellCurrency, setSellCurrency] = useState<"usdc" | "pst">("usdc");
  const [sellCurrencyValue, setSellCurrencyValue] = useState<string>("");
  const [sellTokenAddr, setSellTokenAddr] = useState<string | null>(null);
  const [receiveTokenAddr, setReceiveTokenAddr] = useState<string | null>(null);

  const { data: pstTokendata, isFetching: pstLoading } = useQuery({
    queryKey: ["tokenoverview"],
    queryFn: () => getPstTokenOverview(keyToshare as string),
  });

  const { data: usdcBalance, isFetching: usdcBalLoading } = useQuery({
    queryKey: ["usdcbalance"],
    queryFn: () => getPstTokenBalance(),
  });

  const { data: pstBalance, isFetching: pstBalLoading } = useQuery({
    queryKey: ["pstbalance"],
    queryFn: () => getPstTokenBalance(pstTokendata?.data?.address),
  });

  const { data: swapEstimatesdata, isFetching: estimateLoading } = useQuery({
    queryKey: ["swapestimates", sellTokenAddr, receiveTokenAddr],
    queryFn: () =>
      getSwapTokenEstimates(
        sellTokenAddr as string,
        receiveTokenAddr as string,
        Number(sellCurrencyValue)
      ),
    enabled: !!sellTokenAddr && !!receiveTokenAddr,
  });

  const { mutate: initSwapPST } = useMutation({
    mutationFn: () =>
      swapPSTTokens(receiveTokenAddr as string, Number(sellCurrencyValue)),
    onMutate: () => {
      showsuccesssnack("Please wait, swapping tokens...");
    },
    onSuccess: () => {
      showsuccesssnack("Tokens swap completed successfully");
    },
    onError: () => {
      showerrorsnack("Failed to swap, please try again");
    },
  });

  const sellCurrencyBalance =
    sellCurrency == "usdc"
      ? Number(usdcBalance?.data)
      : Number(pstBalance?.data);

  const onMaxOut = () => {
    sellCurrency == "usdc"
      ? setSellCurrencyValue(usdcBalance?.data as string)
      : setSellCurrencyValue(pstBalance?.data as string);
  };

  const onSwitchCurrency = () => {
    const usdc_address = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359";
    const pst_addres = pstTokendata?.data?.address as string;

    if (sellCurrency == "usdc") {
      setSellCurrency("pst");
      setSellTokenAddr(pst_addres);
      setReceiveTokenAddr(usdc_address);
    } else {
      setSellCurrency("usdc");
      setSellTokenAddr(usdc_address);
      setReceiveTokenAddr(pst_addres);
    }

    queryclient.invalidateQueries({ queryKey: ["swapestimates"] });
  };

  const onFindReceiveQty = () => {
    const usdc_address = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359";
    const pst_addres = pstTokendata?.data?.address as string;

    if (sellCurrency == "usdc") {
      setSellTokenAddr(usdc_address);
      setReceiveTokenAddr(pst_addres);
    } else {
      setSellTokenAddr(pst_addres);
      setReceiveTokenAddr(usdc_address);
    }

    queryclient.invalidateQueries({ queryKey: ["swapestimates"] });
  };

  return (
    <div id="swappst">
      <p className="title">
        Swap
        <span>
          Sell {sellCurrency == "usdc" ? "USDC" : keyToshare} & receive&nbsp;
          {sellCurrency == "usdc" ? keyToshare : "USDC"}
        </span>
      </p>

      <div className="sellcurr_ctr">
        <div className="curr_balance">
          <div className="curr">
            <img
              src={
                sellCurrency == "usdc" ? usdclogo : pstTokendata?.data?.icon_url
              }
              alt="sell currency"
            />

            <span className="currency_name">
              {sellCurrency == "usdc" ? "USDC" : pstTokendata?.data?.symbol}
            </span>
          </div>

          <p className="balance">
            <span>
              {sellCurrency == "usdc"
                ? formatNumber(Number(usdcBalance?.data))
                : formatNumber(Number(pstBalance?.data))}
            </span>
            &nbsp;
            {sellCurrency == "usdc" ? "USDC" : pstTokendata?.data?.symbol}
          </p>
        </div>

        <div className="input_ctr">
          <input
            type="text"
            inputMode="numeric"
            placeholder={`0.5 ${sellCurrency == "usdc" ? "USDC" : keyToshare}`}
            value={sellCurrencyValue}
            onChange={(e) => setSellCurrencyValue(e.target.value)}
            onKeyUp={onFindReceiveQty}
          />
          <span className="sell_title">Sell</span>
          <button className="max_out" onClick={onMaxOut}>
            Max
          </button>
        </div>
      </div>

      <div key={sellCurrency} className="switch_currenncy">
        <button onClick={onSwitchCurrency} disabled={estimateLoading}>
          {estimateLoading ? (
            <Loading />
          ) : (
            <FaIcon faIcon={faArrowsRotate} color={colors.primary} />
          )}
        </button>
      </div>

      <div className="receivecurr_ctr">
        <div className="curr">
          {pstLoading ? (
            <Loading width="1.25rem" height="1.25rem" />
          ) : (
            <>
              <img
                src={
                  sellCurrency == "usdc"
                    ? pstTokendata?.data?.icon_url || defaulttokenlogo
                    : usdclogo
                }
                alt="receive"
              />

              <span className="currency_name">
                {sellCurrency == "usdc" ? keyToshare : "USDC"}
              </span>
            </>
          )}
        </div>

        <div className="receive_qty">
          <p className="qty">
            {swapEstimatesdata?.data?.total || 0}
            &nbsp;
            <span>{sellCurrency == "usdc" ? keyToshare : "USDC"}</span>
          </p>
          <p className="receive_title">Receive</p>
        </div>
      </div>

      <SubmitButton
        text="Swap"
        icon={
          <FaIcon
            faIcon={faArrowsRotate}
            color={
              pstLoading ||
              usdcBalLoading ||
              pstBalLoading ||
              sellCurrencyValue == "" ||
              Number(sellCurrencyValue) >= sellCurrencyBalance
                ? colors.textsecondary
                : colors.primary
            }
          />
        }
        sxstyles={{
          marginTop: "2.5rem",
          padding: "0.625rem",
          borderRadius: "2rem",
        }}
        isDisabled={
          pstLoading ||
          usdcBalLoading ||
          pstBalLoading ||
          sellCurrencyValue == "" ||
          Number(sellCurrencyValue) >= sellCurrencyBalance
        }
        onclick={() => initSwapPST()}
      />
    </div>
  );
};
