import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { backButton } from "@telegram-apps/sdk-react";
import { UseAIHelperPrompt } from "../utils/api/chat";
import { UserMessage, BotMessage } from "../components/chat/Messages";
import { ChatInput } from "../components/chat/ChatInput";
import { LoadingAlt } from "../assets/animations";
import aiHelperLogo from "../assets/images/openai-alt.png";
import "../styles/pages/chatbot.scss";
import "../styles/pages/aihelper.scss";

// Define feature buttons
const FEATURE_BUTTONS = [
  { 
    label: "Get OM", 
    command: "/get_om", 
    icon: "💰",
    description: "Buy OM using Eth, USD, or HKD"
  },
  { 
    label: "Send BTC", 
    command: "/send_btc", 
    icon: "₿",
    description: "Send Bitcoin directly"
  },
  { 
    label: "Send ETH", 
    command: "/send_eth", 
    icon: "Ξ",
    description: "Send Ethereum easily"
  },
  { 
    label: "Lend & Earn", 
    command: "/lend_earn", 
    icon: "💸",
    description: "Use crypto assets to earn rewards"
  },
  { 
    label: "Security", 
    command: "/security", 
    icon: "🔒",
    description: "Manage wallet security settings"
  },
  { 
    label: "Rewards", 
    command: "/rewards", 
    icon: "🏆",
    description: "Check your rewards status"
  },
  { 
    label: "Referral", 
    command: "/referral", 
    icon: "👥",
    description: "Invite friends, earn rewards"
  }
];

export default function AIHelper(): React.JSX.Element {
  const navigate = useNavigate();
  const [botLoading, setBotLoading] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([
    {
      role: "assistant",
      content: "Welcome to StratoSphere ID AI Helper! Choose a feature or ask a question."
    }
  ]);

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(() => navigate("/app"));
    }

    return () => {
      backButton.unmount();
    };
  }, [navigate]);

  const handleFeatureClick = async (command: string) => {
    setBotLoading(true);
    
    try {
      const access = localStorage.getItem("token");
      const helperResponse = await UseAIHelperPrompt(access || "", command);

      // Add feature button click as user message
      setChatMessages(prev => [
        ...prev, 
        { role: "user", content: command }
      ]);

      // Add bot response
      setChatMessages(prev => [
        ...prev, 
        { 
          role: "assistant", 
          content: helperResponse.message 
        }
      ]);

      // Optional: Navigate to the link if provided
      if (helperResponse.link) {
        navigate(helperResponse.link);
      }
    } catch (error) {
      console.error("AI Helper Error:", error);
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setBotLoading(false);
    }
  };

  const submitPrompt = async (userPrompt: string) => {
    setBotLoading(true);
    
    // Add user message
    setChatMessages(prev => [...prev, { role: "user", content: userPrompt }]);

    try {
      const access = localStorage.getItem("token");
      const helperResponse = await UseAIHelperPrompt(access || "", userPrompt);

      // Add bot response
      setChatMessages(prev => [
        ...prev, 
        { 
          role: "assistant", 
          content: helperResponse.message 
        }
      ]);

      // Optional: Navigate to the link if provided
      if (helperResponse.link) {
        navigate(helperResponse.link);
      }
    } catch (error) {
      console.error("AI Helper Error:", error);
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setBotLoading(false);
    }
  };

  return (
    <section id="chatbot" className="ai-helper">
      <div className="chattitle">
        <div className="logo">
          <img src={aiHelperLogo} alt="AI Helper" />
          <span>AI Helper</span>
        </div>

        <p className="desc">
          Get instant guidance on StratoSphere ID features
        </p>
      </div>

      <div className="feature-buttons">
        {FEATURE_BUTTONS.map((feature) => (
          <button 
            key={feature.command} 
            onClick={() => handleFeatureClick(feature.command)}
            className="feature-button"
          >
            <span className="feature-icon">{feature.icon}</span>
            <div className="feature-details">
              <span className="feature-label">{feature.label}</span>
              <small>{feature.description}</small>
            </div>
          </button>
        ))}
      </div>

      <div className="messages">
        {chatMessages.map((message, index) => 
          message.role === "user" ? (
            <UserMessage 
              key={`user-${index}`} 
              message={message.content} 
            />
          ) : (
            <BotMessage 
              key={`bot-${index}`} 
              message={message.content} 
            />
          )
        )}
        {botLoading && <LoadingAlt width="3rem" height="3rem" />}
      </div>

      <ChatInput 
        promptLoading={botLoading} 
        onSubmitPrompt={submitPrompt} 
      />
    </section>
  );
}