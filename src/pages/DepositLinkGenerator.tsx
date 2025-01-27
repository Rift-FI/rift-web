import type React from "react"
import { useEffect, useState } from "react"
import { Copy, QrCode, CheckCircle2, LinkIcon } from "lucide-react"
import { backButton, openTelegramLink } from "@telegram-apps/sdk-react"
import { useTabs } from "../hooks/tabs"
import { useNavigate } from "react-router"
import { Telegram } from "../assets/icons"
import "../styles/pages/DepositLinkGenerator.css";

export const DepositLinkGenerator: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string>("0x123456789abcdef")
  const [generatedLink, setGeneratedLink] = useState<string>("")
  const [copyStatus, setCopyStatus] = useState<boolean>(false)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)

  const generateDepositLink = () => {
    setIsGenerating(true)
    setTimeout(() => {
      const link = `https://t.me/glennin123bot/app?address=${walletAddress}`
      setGeneratedLink(link)
      setIsGenerating(false)
    }, 1500)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopyStatus(true)
    setTimeout(() => setCopyStatus(false), 2000)
  }

  const onShareTg = () => {
    openTelegramLink(`https://t.me/share/url?url=${generatedLink}&text=Deposit asset directly to someone's wallet`)
  }

  const { switchtab } = useTabs()
  const navigate = useNavigate()
  const goBack = () => {
    switchtab("profile")
    navigate(-1)
  }

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount()
      backButton.show()
    }

    if (backButton.isMounted()) {
      backButton.onClick(goBack)
    }

    return () => {
      backButton.offClick(goBack)
      backButton.unmount()
    }
  }, [goBack]) // Added goBack to dependencies

  return (
    <div className="deposit-link-generator">
      <div className="card">
        <div className="card-header">
          <LinkIcon className="header-icon" />
          <h1>Generate Deposit Link</h1>
          <p>Create a unique deposit link for your wallet</p>
        </div>

        <div className="input-group">
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Your Wallet Address"
          />
          <QrCode className="qr-icon" />
        </div>

        <button
          onClick={generateDepositLink}
          className={`generate-btn ${isGenerating ? "generating" : ""}`}
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate Link"}
        </button>

        {generatedLink && (
          <div className="generated-link">
            <div className="link-header">
              <span>Generated Link</span>
              <button onClick={() => copyToClipboard(generatedLink)} className="copy-icon">
                {copyStatus ? <CheckCircle2 className="success" /> : <Copy />}
              </button>
            </div>
            <div className="link-display">
              <input type="text" value={generatedLink} readOnly />
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
            
               <Telegram width={18} height={18}  />
               Share
          </button>
        </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DepositLinkGenerator

