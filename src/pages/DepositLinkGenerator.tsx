import { useEffect, useState } from "react"
import { backButton, openTelegramLink } from "@telegram-apps/sdk-react"

import { useNavigate } from "react-router"
import { Copy, LinkIcon, Share2 } from "lucide-react"
 import "../styles/pages/DepositLinkGenerator.css";
import { useTabs } from "../hooks/tabs";

export default function DepositLinkGenerator() {
  const [copyStatus, setCopyStatus] = useState(false)



    const [walletAddress, setWalletAddress] = useState<string>('')
  const [generatedLink, setGeneratedLink] = useState<string>("")

  const [isGenerating, setIsGenerating] = useState<boolean>(false)


  useEffect(()=>{
generateDepositLink();
  },[]);
  const generateDepositLink = () => {
    setWalletAddress("0x123456789abcdef");
    setIsGenerating(true)
    setTimeout(() => {
      const link = `https://t.me/glennin123bot/app?address=${walletAddress}`
      setGeneratedLink(link)
      setIsGenerating(false)
    }, 3000)
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink)
    setCopyStatus(true)
    setTimeout(() => setCopyStatus(false), 2000)
  }

  return (
    <div className="referral-container">
      <div className="referral-card">
        <div className="card-header">
          <div className="icon-circle">
            <LinkIcon className="header-icon" />
          </div>
          <h1>Generate Payment Link</h1>
          <p>Create a shareable link for receiving crypto payment</p>
        </div>

        <div className="earnings-section">
          <p className="label">You have recieved</p>
          <div className="amount">
            <span>0</span>
            <span className="currency">USDC</span>
          </div>
        </div>

        <div className="link-section">
          <div className="link-header">
            {isGenerating?<span>Your link is generating...</span> : <span>Your link is ready to share</span>}
            <LinkIcon className="link-icon" />
          </div>
          <div className="link-input-container">
            <input type="text" value={generatedLink} readOnly className="link-input" />
            <button onClick={copyToClipboard} className="copy-button">
              {copyStatus ? <span className="success">✓</span> : <Copy className="copy-icon" />}
            </button>
          </div>
        </div>

        <button className="share-button " onClick={onShareTg}>
          <Share2 className="share-icon"  />
          Share On Telegram
        </button>

        <div className="referral-info">
          <p>Generate a link to receive crypto payments directly to your wallet 🚀</p>
        </div>
      </div>
    </div>
  )
}

