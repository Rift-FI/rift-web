import { JSX, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useTabs } from "../hooks/tabs";
import { useSnackbar } from "../hooks/snackbar";
import { useBackButton } from "../hooks/backbutton";
import {
  getAllBalances,
  supportedchains,
  supportedtokens,
} from "../utils/api/balances";
import { PopOver } from "../components/global/PopOver";
import { Copy, Warning } from "../assets/icons";
import { colors } from "../constants";
import btclogo from "../assets/images/logos/btc.png";
import ethlogo from "../assets/images/logos/eth.png";
import usdclogo from "../assets/images/logos/usdc.png";
import usdtlogo from "../assets/images/logos/usdt.png";
import arblogo from "../assets/images/logos/arbitrum.png";
import dailogo from "../assets/images/logos/dai.png";
import beralogo from "../assets/images/logos/bera.png";
import maticlogo from "../assets/images/logos/matic.png";
import lisklogo from "../assets/images/logos/lisk.png";
import bnblogo from "../assets/images/logos/bnb.png";
import optimismlogo from "../assets/images/logos/optimism.png";
import "../styles/pages/deposit.scss";

export default function Deposit(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack } = useSnackbar();
  const { switchtab } = useTabs();

  const [depositAsset, setDepositAsset] = useState<supportedtokens>("ETH");
  const [selectedChain, setSelectedChain] =
    useState<supportedchains>("ETHEREUM");
  const [tokenPickerAnchorEl, setTokenPickerAnchorEl] =
    useState<HTMLDivElement | null>(null);

  const ethaddress = localStorage.getItem("ethaddress") as string;
  const beraUsdcContractAddress = "0x549943e04f40284185054145c6E4e9568C1D3241";
  const polUsdcContractAddres = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";

  const { data: allbalances, isPending: balancesloading } = useQuery({
    queryKey: ["allbalances"],
    queryFn: getAllBalances,
  });
  const combinedAssets = Object.values(allbalances?.data || []).flat();

  const onCopyAddr = () => {
    navigator.clipboard.writeText(ethaddress);
    showsuccesssnack("Address copied to clipboard");
  };

  const onCopyContractAddr = () => {
    navigator.clipboard.writeText(
      depositAsset == "USDC.e" ? beraUsdcContractAddress : polUsdcContractAddres
    );
    showsuccesssnack("Contract address copied to clipboard");
  };

  const goBack = () => {
    const prevpage = localStorage.getItem("prev_page");

    if (prevpage == null) {
      switchtab("home");
      navigate("/app");
    } else {
      navigate(prevpage);
    }
  };

  useBackButton(goBack);

  return (
    <section id="deposit">
      <p className="title_desc">
        Deposit
        <span>Use your address to receive crypto in your Sphere wallet</span>
      </p>

      <div
        className="currency_picker"
        onClick={(e) => setTokenPickerAnchorEl(e.currentTarget)}
      >
        <img
          src={
            depositAsset == "ETH" ||
            depositAsset == "WETH" ||
            depositAsset == "WSTETH" ||
            depositAsset == "RETH" ||
            depositAsset == "CBETH"
              ? ethlogo
              : depositAsset == "WBTC" ||
                depositAsset == "CBBTC" ||
                depositAsset == "TBTC"
              ? btclogo
              : depositAsset == "ARB"
              ? arblogo
              : depositAsset == "BERA" || depositAsset == "WBERA"
              ? beralogo
              : depositAsset == "DAI"
              ? dailogo
              : depositAsset == "USDC" || depositAsset == "USDC.e"
              ? usdclogo
              : depositAsset == "USDT"
              ? usdtlogo
              : depositAsset == "OP"
              ? optimismlogo
              : depositAsset == "MATIC"
              ? maticlogo
              : depositAsset == "LSK"
              ? lisklogo
              : bnblogo
          }
          alt={depositAsset}
        />
        <p>
          {depositAsset} <span>{selectedChain}</span>
        </p>
      </div>
      <PopOver
        anchorEl={tokenPickerAnchorEl}
        setAnchorEl={setTokenPickerAnchorEl}
      >
        <div className="sell-receive-tokens-ctr">
          {combinedAssets?.map((_token) => (
            <div
              onClick={() => {
                setDepositAsset(_token?.symbol);
                setSelectedChain(_token?.chain);
                setTokenPickerAnchorEl(null);
              }}
            >
              <img
                src={
                  _token?.symbol == "ETH" ||
                  _token?.symbol == "WETH" ||
                  _token?.symbol == "WSTETH" ||
                  _token?.symbol == "RETH" ||
                  _token?.symbol == "CBETH"
                    ? ethlogo
                    : _token?.symbol == "WBTC" ||
                      _token?.symbol == "CBBTC" ||
                      _token?.symbol == "TBTC"
                    ? btclogo
                    : _token?.symbol == "ARB"
                    ? arblogo
                    : _token?.symbol == "BERA" || _token?.symbol == "WBERA"
                    ? beralogo
                    : _token?.symbol == "DAI"
                    ? dailogo
                    : _token?.symbol == "USDC" || _token?.symbol == "USDC.e"
                    ? usdclogo
                    : _token?.symbol == "USDT"
                    ? usdtlogo
                    : _token?.symbol == "OP"
                    ? optimismlogo
                    : _token?.symbol == "MATIC"
                    ? maticlogo
                    : _token?.symbol == "LSK"
                    ? lisklogo
                    : bnblogo
                }
                alt={_token?.symbol}
              />
              <p>
                {_token?.symbol} <br />
                <span>{_token?.chain}</span>
              </p>
            </div>
          ))}
        </div>
      </PopOver>

      <div className="txtaddress">
        <span>{ethaddress.substring(0, ethaddress.length / 2)}...</span>
        <button onClick={onCopyAddr}>
          Copy <Copy color={colors.textsecondary} />
        </button>
      </div>

      <div className="contractnotes">
        <Warning color={colors.textsecondary} />

        <p className="network">
          Only send&nbsp;
          <span>{depositAsset}</span>
          &nbsp;to this addres on&nbsp;
          <span>{selectedChain}</span>
        </p>

        {(depositAsset == "USDC" || depositAsset == "USDC.e") && (
          <div>
            <p>
              To ensure you are intercting with the correct token, please use
              this contract address&nbsp;
              <span>
                {depositAsset == "USDC.e"
                  ? beraUsdcContractAddress
                  : polUsdcContractAddres}
              </span>
            </p>

            <button onClick={onCopyContractAddr}>
              Copy Contract Address <Copy color={colors.textsecondary} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
