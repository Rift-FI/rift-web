import type React from "react";
import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
// Import images
import btcIcon from "../assets/images/btc.png";
import ethIcon from "../assets/images/eth.png";
import usdcIcon from "../assets/images/labs/usdc.png";

// import hkdIcon from '../assets/images/hkd.png'

import "../styles/pages/DepositPage.scss";
import { backButton, useLaunchParams } from "@telegram-apps/sdk-react";
import { useTabs } from "../hooks/tabs";
import { useNavigate, useSearchParams } from "react-router";

interface Asset {
  symbol: string;
  name: string;
  icon: string;
  minimumDeposit: number;
  color: string;
}

const availableAssets: Asset[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    icon: btcIcon,
    minimumDeposit: 0.0001,
    color: "#F7931A",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    icon: ethIcon,
    minimumDeposit: 0.01,
    color: "#627EEA",
  },
  {
    symbol: "USDC",
    name: "USDC Coin",
    icon: usdcIcon,
    minimumDeposit: 10,
    color: "#2775CA",
  },
  // {
  //   symbol: "HKD",
  //   name: "HKD Coin",
  //   icon: hkdIcon,
  //   minimumDeposit: 30,
  //   color: "#2765CA",
  // },
];

export const DepositPage: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const { switchtab } = useTabs();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { initData } = useLaunchParams();
  const recipientUsername = initData?.user?.username as string;

  useEffect(() => {
    const address = searchParams.get("address") ?? "0x123456789abcdef";
    if (address) {
      setWalletAddress(address);
    }
  }, [searchParams]);

  const goBack = () => {
    switchtab("profile");
    navigate(-1);
  };

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(goBack);
    }

    return () => {
      backButton.offClick(goBack);
      backButton.unmount();
    };
  }, []);

  return (
    <div className="deposit-page-container">
      <div className="deposit-page-card">
        <div className="deposit-page-header">
          <div className="icon-container">
            <Gift size={48} color="#F7931A" />
          </div>
          <h1>Send Payment</h1>
          <p className="description">
            Transfer crypto directly to {recipientUsername}'s wallet.
          </p>
          <div className="wallet-address">
            {walletAddress && (
              <span>
                {walletAddress.substring(0, 6)}...
                {walletAddress.substring(walletAddress.length - 6)}
              </span>
            )}
          </div>
        </div>

        <div className="asset-list">
          {availableAssets.map((asset) => (
            <div
              key={asset.symbol}
              onClick={() => setSelectedAsset(asset)}
              className={`asset-item ${
                selectedAsset?.symbol === asset.symbol ? "selected" : ""
              }`}
            >
              <div className="asset-icon-container">
                <div
                  className="asset-icon-backdrop"
                  style={{ backgroundColor: `${asset.color}20` }}
                >
                  <img src={asset.icon} alt="image" className="icon-image" />
                </div>
              </div>
              <div className="asset-info">
                <div className="asset-name-container">
                  <span className="asset-name">{asset.name}</span>
                  <span className="asset-symbol">{asset.symbol}</span>
                </div>
                <span className="asset-minimum">
                  Min: {asset.minimumDeposit}
                </span>
              </div>
            </div>
          ))}
        </div>

        {selectedAsset && (
          <div className="deposit-form">
            <div className="floating-input">
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder=" "
              />
              <label>Support Amount ({selectedAsset.symbol})</label>
              <div className="input-border"></div>
            </div>

            <button
              className={`action-button ${
                Number(depositAmount) >= selectedAsset.minimumDeposit
                  ? "active"
                  : "disabled"
              }`}
              disabled={Number(depositAmount) < selectedAsset.minimumDeposit}
            >
              <span> Confirm Payment</span>
              <div className="button-glow"></div>
            </button>
          </div>
        )}
      </div>
      <div className="footer-depo">
        <div className="glowing-card">
          <p className="footer-text">
            Secure and instant crypto payments. All transactions are processed
            on-chain for maximum security and transparency. Need help? Contact
            support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DepositPage;
