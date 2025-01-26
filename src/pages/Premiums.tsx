import React, { useState, useEffect } from 'react';
import { ShieldCheck, Zap, Lock, ChevronsDown, Bitcoin } from 'lucide-react';
import '../styles/pages/premiums.css';
import { backButton } from '@telegram-apps/sdk-react';
import { useTabs } from '../hooks/tabs';
import { useNavigate } from "react-router";



interface PremiumFeature {
  id: number;
  title: string;
  description: string[];
  price: number;
  icon: React.ElementType;
  benefits: string[];
}

const telegramPremiumFeatures: PremiumFeature[] = [
  {
    id: 1,
    title: 'Crypto Telegram Premium',
    description: [
      'First-ever Telegram Premium subscription via crypto',
      'Seamless integration with Stratosphere wallet'
    ],
    price: 2.41,
    icon: Bitcoin,
    benefits: [
      'Pay with wallet assets',
      '50% revenue share',
      'Flexible crypto payment',
      'No fiat required'
    ]
  }
];

const stratospherePremiumFeatures: PremiumFeature[] = [
  {
    id: 2,
    title: 'Advanced Recovery',
    description: [
      'Secure account recovery mechanism',
      'Multiple verification layers'
    ],
    price: 2.99,
    icon: ShieldCheck,
    benefits: [
      'Multi-factor authentication',
      'Encrypted recovery paths',
      'Instant account restoration',
      'Secure key management'
    ]
  },
  {
    id: 3,
    title: 'Key Management Pro',
    description: [
      'Next-level private key security',
      'Advanced wallet management'
    ],
    price: 1.99,
    icon: Lock,
    benefits: [
      'Secure key storage',
      'Encrypted backups',
      'Multi-device sync',
      'Instant key rotation'
    ]
  },
  {
    id: 4,
    title: 'Airdrop Maximizer',
    description: [
      'Exclusive cryptocurrency airdrop access',
      'Early token allocation opportunities'
    ],
    price: 2.99,
    icon: Zap,
    benefits: [
      'Priority airdrop alerts',
      'Automatic participation',
      'Detailed token insights',
      'Reduced gas fees'
    ]
  }
];

const PremiumFeaturesPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'telegram' | 'stratosphere'>('telegram');

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

  const renderFeatureCard = (feature: PremiumFeature) => (
    <div 
      key={feature.id} 
      className="premium-feature-card"
    >
      <div className="feature-header">
        <feature.icon size={48}  strokeWidth={1.5} />
        <h3>{feature.title}</h3>
      </div>
      
      <div className="feature-description">
        {feature.description.map((desc, index) => (
          <p key={index}>{desc}</p>
        ))}
      </div>
      
      <div className="feature-price">
        <span>${feature.price}/month</span>
      </div>
      
      <div className="feature-benefits">
        <h4>Benefits</h4>
        <ul>
          {feature.benefits.map((benefit, index) => (
            <li key={index}>
              <ChevronsDown size={16}  />
              {benefit}
            </li>
          ))}
        </ul>
      </div>
      
      <button className="subscribe-button">
        Subscribe Now
      </button>
    </div>
  );

  return (
    <div className="premium-features-container">
      <div className="premium-header">
        <h1>Stratosphere Wallet Premium</h1>
        <p>Unlock powerful features with flexible crypto payments</p>
      </div>

      <div className="premium-tabs">
        <button 
          onClick={() => setSelectedTab('telegram')}
          className={selectedTab === 'telegram' ? 'active' : ''}
        >
          Telegram Premium
        </button>
        <button 
          onClick={() => setSelectedTab('stratosphere')}
          className={selectedTab === 'stratosphere' ? 'active' : ''}
        >
          Stratosphere Premium
        </button>
      </div>

      <div className="premium-features-grid">
        {selectedTab === 'telegram' 
          ? telegramPremiumFeatures.map(renderFeatureCard)
          : stratospherePremiumFeatures.map(renderFeatureCard)
        }
      </div>
    </div>
  );
};

export default PremiumFeaturesPage;