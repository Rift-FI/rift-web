import React, { useEffect, useState } from 'react';
import { 
  // Share2, 
  Copy, 
  QrCode, 
  CheckCircle2, 

  Link as LinkIcon
} from 'lucide-react';
import '../styles/pages/DepositLinkGenerator.css';
import { backButton, openTelegramLink } from '@telegram-apps/sdk-react';
import { useTabs } from '../hooks/tabs';
import { useNavigate } from 'react-router';
import {  Telegram } from "../assets/icons";
import { colors } from '../constants';



export const DepositLinkGenerator: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string>('0x123456789abcdef');
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [copyStatus, setCopyStatus] = useState<boolean>(false);

  const generateDepositLink = () => {
    const link = `https://t.me/glennin123bot/app?address=${walletAddress}`;
    setGeneratedLink(link);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };
   const onShareTg = () => {
      openTelegramLink(
        `https://t.me/share/url?url=${generatedLink}&text=Deposit asset directly to someones wallet `
      );
    };
  

  const { switchtab } = useTabs();
  const navigate = useNavigate();
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
    <div className="deposit-link-generator-container">
      <div className="deposit-link-generator-card">
        <div className="deposit-link-header">
          <h1><LinkIcon strokeWidth={2.5} /> Generate Deposit Link</h1>
          <p>Create a unique deposit link for your wallet</p>
        </div>

        <div className="deposit-link-form">
          <div className="wallet-address-input">
            <input 
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Your Wallet Address"
            />
            <QrCode className="qr-icon" size={20} />
          </div>

          <button 
            onClick={generateDepositLink}
            className="generate-link-btn"
          >
            Generate Link
          </button>
        </div>

        {generatedLink && (
          <div className="generated-link-section">
            <div className="link-header">
              <span>Generated Link</span>
              <button onClick={() => copyToClipboard(generatedLink)}>
                {copyStatus ? <CheckCircle2 color="green" /> : <Copy size={16}  />}
              </button>
            </div>
            <div className="link-display">
              <input 
                type="text" 
                value={generatedLink} 
                readOnly 
              />
            </div>
            <div className="link-actions">
              <button 
                onClick={() => copyToClipboard(generatedLink)}
                className="copy-btn"
              >
                <Copy size={16} /> Copy
              </button>
              <button className="share-btn"
              onClick={onShareTg}
              >
                
                   <Telegram width={18} height={18} color={colors.accent} />
                   Share
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepositLinkGenerator;