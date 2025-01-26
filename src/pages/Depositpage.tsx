import React, { useEffect, useState } from 'react';
import { Bitcoin, DollarSign } from 'lucide-react';
import '../styles/pages/DepositPage.css';
import { backButton } from '@telegram-apps/sdk-react';
import { useTabs } from '../hooks/tabs';
import { useNavigate, useSearchParams } from 'react-router';

interface Asset {
  symbol: string;
  name: string;
  icon: React.ElementType;
  minimumDeposit: number;
  color: string;
}

const availableAssets: Asset[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: Bitcoin,
    minimumDeposit: 0.0001,
    color: '#F7931A'
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: DollarSign,
    minimumDeposit: 0.01,
    color: '#627EEA'
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    icon: DollarSign,
    minimumDeposit: 10,
    color: '#2775CA'
  }
];

export const DepositPage: React.FC= () => {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const { switchtab } = useTabs();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  useEffect(() => {
    // Extract the wallet address from the URL query parameter
    const address = searchParams.get('address');
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
          <h1>Deposit Assets</h1>
          <p>Select an asset to deposit to {walletAddress}</p>
        </div>

        <div className="asset-selection-grid">
          {availableAssets.map(asset => (
            <div 
              key={asset.symbol}
              onClick={() => setSelectedAsset(asset)}
              className={`asset-card ${selectedAsset?.symbol === asset.symbol ? 'selected' : ''}`}
              style={{ 
                backgroundColor: `${asset.color}1A`,
                borderColor: selectedAsset?.symbol === asset.symbol ? 'var(--accent)' : 'transparent'
              }}
            >
              <div 
                className="asset-icon" 
                style={{ backgroundColor: `${asset.color}1A` }}
              >
                <asset.icon size={24} color={asset.color} />
              </div>
              <span className="asset-symbol">{asset.symbol}</span>
            </div>
          ))}
        </div>

        {selectedAsset && (
          <div className="deposit-form">
            <div className="deposit-input">
              <label>Amount {selectedAsset.symbol}</label>
              <input 
                type="number" 
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder={`Min: ${selectedAsset.minimumDeposit}`}
              />
              <span className="asset-unit">{selectedAsset.symbol}</span>
            </div>
            <button 
              className={`deposit-button ${Number(depositAmount) >= selectedAsset.minimumDeposit ? 'active' : 'disabled'}`}
              disabled={Number(depositAmount) < selectedAsset.minimumDeposit}
            >
              Deposit {selectedAsset.symbol}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepositPage;