import { CSSProperties, Dispatch, JSX, ReactNode, SetStateAction } from "react";
import { Popover } from "@mui/material";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import wusdlogo from "../../assets/images/wusd.png";
import beralogo from "../../assets/images/icons/bera.webp";
import mantralogo from "../../assets/images/labs/mantralogo.jpeg";

interface popOverProps {
  children: ReactNode;
  anchorEl: HTMLDivElement | null;
  setAnchorEl: Dispatch<SetStateAction<HTMLDivElement | null>>;
  onClose?: () => void;
}

interface allCurrencyPopOverProps<T extends string> {
  anchorEl: HTMLDivElement | null;
  setAnchorEl: Dispatch<SetStateAction<HTMLDivElement | null>>;
  setCurrency: Dispatch<SetStateAction<T>>;
  allowedCurrencies?: string[];
}

// Define the specific types used by CryptoPopOver
type CryptoAssetType = "OM" | "HKDA" | "WUSD" | "USDC" | "ETH" | "BTC";

interface cryptoPopOverProps {
  anchorEl: HTMLDivElement | null;
  setAnchorEl: Dispatch<SetStateAction<HTMLDivElement | null>>;
  setCurrency: Dispatch<SetStateAction<CryptoAssetType>>;
  sxstyles?: CSSProperties;
}

export const PopOver = ({
  children,
  anchorEl,
  setAnchorEl,
}: popOverProps): JSX.Element => {
  const popOverOPen = Boolean(anchorEl);
  const popOverId = popOverOPen ? "generic-popover" : undefined;

  const onClose = () => {
    setAnchorEl(null);
  };

  return (
    <Popover
      id={popOverId}
      open={popOverOPen}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      elevation={0}
      slotProps={{
        paper: { style: popOverStyles },
      }}
    >
      {children}
    </Popover>
  );
};

export const PopOverAlt = ({
  children,
  anchorEl,
  setAnchorEl,
  onClose: customOnClose,
}: popOverProps): JSX.Element => {
  const popOverOPen = Boolean(anchorEl);
  const popOverId = popOverOPen ? "generic-popover" : undefined;

  const onClose = () => {
    setAnchorEl(null);
    customOnClose?.();
  };

  return (
    <Popover
      id={popOverId}
      open={popOverOPen}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "left" }}
      elevation={0}
      slotProps={{
        paper: { style: { ...popOverStyles, width: "12rem", height: "8rem" } },
      }}
    >
      {children}
    </Popover>
  );
};

export const CurrencyPopOver = <T extends string>({
  anchorEl,
  setAnchorEl,
  setCurrency,
  allowedCurrencies,
}: allCurrencyPopOverProps<T>): JSX.Element => {
  const popOverOPen = Boolean(anchorEl);
  const popOverId = popOverOPen ? "generic-popover" : undefined;

  const onClose = () => {
    setAnchorEl(null);
  };

  const allOptions = [
    { id: "WBERA", name: "Berachain", logo: beralogo, type: "Crypto" },
    { id: "ETH", name: "Ethereum", logo: ethlogo, type: "Crypto" },
    {
      id: "USDC",
      name: "USDC (Polygon)",
      logo: usdclogo,
      type: "",
    },
    {
      id: "WUSDC",
      name: "USDC.E",
      logo: usdclogo,
      type: "",
    },
  ];

  const filteredOptions = allowedCurrencies
    ? allOptions.filter((option) => allowedCurrencies.includes(option.id))
    : allOptions;

  return (
    <Popover
      id={popOverId}
      open={popOverOPen}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      elevation={0}
      slotProps={{
        paper: { style: popOverStyles },
      }}
    >
      <div className="select_secrets p-2 space-y-1">
        {filteredOptions.map((asset) => (
          <div
            key={asset.id}
            className="img_desc flex items-center gap-2 p-2 hover:bg-[#2a2a2a] rounded-lg cursor-pointer"
            onClick={() => {
              setCurrency(asset.id as T);
              setAnchorEl(null);
            }}
          >
            {asset.logo.startsWith("http") || asset.logo.startsWith("/") ? (
              <img
                src={asset.logo}
                alt={asset.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <span className="_icons text-2xl">{asset.logo}</span>
            )}
            <p className="desc text-sm text-[#f6f7f9]">
              {asset.id} <br />{" "}
              <span className="text-xs text-gray-400">{asset.name}</span>
            </p>
          </div>
        ))}
      </div>
    </Popover>
  );
};

export const CryptoPopOver = ({
  anchorEl,
  setAnchorEl,
  setCurrency,
  sxstyles,
}: cryptoPopOverProps): JSX.Element => {
  const popOverOPen = Boolean(anchorEl);
  const popOverId = popOverOPen ? "generic-popover" : undefined;

  const onClose = () => {
    setAnchorEl(null);
  };

  return (
    <Popover
      id={popOverId}
      open={popOverOPen}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      elevation={0}
      slotProps={{
        paper: { style: { ...popOverStyles, width: "12rem", ...sxstyles } },
      }}
    >
      <div className="select_secrets">
        <div
          className="img_desc"
          onClick={() => {
            setCurrency("OM");
            setAnchorEl(null);
          }}
        >
          <img src={mantralogo} alt="secret" />

          <p className="desc">
            OM <br />
            <span>Mantra</span>
          </p>
        </div>

        <div
          className="img_desc"
          onClick={() => {
            setCurrency("HKDA");
            setAnchorEl(null);
          }}
        >
          <span className="_icons">🇭🇰</span>

          <p className="desc">
            HKDA <br />
            <span>HKDA</span>
          </p>
        </div>

        <div
          className="img_desc"
          onClick={() => {
            setCurrency("WUSD");
            setAnchorEl(null);
          }}
        >
          <img src={wusdlogo} alt="secret" />

          <p className="desc">
            WUSD <br />
            <span>Worldwide USD</span>
          </p>
        </div>

        <div
          className="img_desc"
          onClick={() => {
            setCurrency("USDC");
            setAnchorEl(null);
          }}
        >
          <img src={usdclogo} alt="secret" />

          <p className="desc">
            USDC <br />
            <span>USD Coin</span>
          </p>
        </div>

        <div
          className="img_desc"
          onClick={() => {
            setCurrency("ETH");
            setAnchorEl(null);
          }}
        >
          <img src={ethlogo} alt="secret" />

          <p className="desc">
            ETH <br />
            <span>Ethereum</span>
          </p>
        </div>

        <div
          className="img_desc"
          onClick={() => {
            setCurrency("BTC");
            setAnchorEl(null);
          }}
        >
          <img src={btclogo} alt="secret" />

          <p className="desc">
            BTC <br />
            <span>Bitcoin</span>
          </p>
        </div>
      </div>
    </Popover>
  );
};

const popOverStyles: CSSProperties = {
  marginTop: 6,
  border: `1px solid #34404f`,
  borderRadius: "0.5rem",
  backgroundColor: "transparent",
  zIndex: 10000,
};
