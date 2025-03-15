import { CSSProperties, Dispatch, JSX, ReactNode, SetStateAction } from "react";
import { Popover } from "@mui/material";
import { assetType } from "../../pages/lend/CreateLendAsset";
import { colors } from "../../constants";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import wusdlogo from "../../assets/images/wusd.png";
import mantralogo from "../../assets/images/labs/mantralogo.jpeg";

interface popOverProps {
  children: ReactNode;
  anchorEl: HTMLDivElement | null;
  setAnchorEl: Dispatch<SetStateAction<HTMLDivElement | null>>;
}

interface allCurrencyPopOverProps {
  anchorEl: HTMLDivElement | null;
  setAnchorEl: Dispatch<SetStateAction<HTMLDivElement | null>>;
  setCurrency: Dispatch<SetStateAction<assetType>>;
}

interface cryptoPopOverProps {
  anchorEl: HTMLDivElement | null;
  setAnchorEl: Dispatch<SetStateAction<HTMLDivElement | null>>;
  setCurrency: Dispatch<SetStateAction<Exclude<assetType, "USD" | "HKD">>>;
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

export const CurrencyPopOver = ({
  anchorEl,
  setAnchorEl,
  setCurrency,
}: allCurrencyPopOverProps): JSX.Element => {
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
      <div className="select_secrets">
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
            <span>Crypto</span>
          </p>
        </div>

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
            <span>Crypto</span>
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
            HKDA <br /> <span>Crypto (Stablecoin)</span>
          </p>
        </div>

        <div
          className="img_desc"
          onClick={() => {
            setCurrency("HKD");
            setAnchorEl(null);
          }}
        >
          <span className="_icons">🇭🇰</span>

          <p className="desc">
            HKD <br /> <span>Fiat</span>
          </p>
        </div>

        <div
          className="img_desc"
          onClick={() => {
            setCurrency("USD");
            setAnchorEl(null);
          }}
        >
          <span className="_icons">🇺🇸</span>

          <p className="desc">
            USD <br /> <span>Fiat</span>
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
            USDC <br /> <span>Crypto (Stablecoin)</span>
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
            ETH <br /> <span>Crypto</span>
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
            BTC <br /> <span>Crypto</span>
          </p>
        </div>
      </div>
    </Popover>
  );
};

export const CryptoPopOver = ({
  anchorEl,
  setAnchorEl,
  setCurrency,
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
        paper: { style: { ...popOverStyles, width: "12rem" } },
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
  width: "100%",
  height: "14rem",
  marginTop: 6,
  border: `1px solid ${colors.divider}`,
  borderRadius: "0.5rem",
  backgroundColor: colors.primary,
  zIndex: 10000,
};
