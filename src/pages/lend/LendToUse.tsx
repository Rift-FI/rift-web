import { CSSProperties, JSX, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { BorrowedAsset } from "../../components/lend/Assets";
import { BorrowedSecret, LentSecret } from "../../components/lend/Secrets";
import { SubmitButton } from "../../components/global/Buttons";
import { Import, Stake } from "../../assets/icons/actions";
import { colors } from "../../constants";
import "../../styles/pages/lendspend.scss";

export default function LendToUse(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const [selector, setSelector] = useState<"lent" | "borrowed">("borrowed");

  const secretRevoked = localStorage.getItem("revokedsecret");

  const goBack = () => {
    switchtab("home");
    navigate("/");
  };

  const lendAsset = () => {
    navigate("/lend/asset");
  };

  const lendSecret = () => {
    navigate("/lend/secret/nil/nil");
  };

  useBackButton(goBack);

  useEffect(() => {
    const firsttimelend = localStorage.getItem("firsttimelend");

    if (firsttimelend == null) {
      navigate("/lend/info");
    }
  }, []);

  return (
    <section id="lendtospend">
      <div className="header">
        <p className="title">
          Lend & Earn
          <span>Lend out your idle crypto assets and secrets</span>
        </p>
      </div>

      <div className="filters">
        <button
          className={`filter-btn ${selector === "borrowed" ? "active" : ""}`}
          onClick={() => setSelector("borrowed")}
        >
          <Stake
            color={
              selector === "borrowed" ? colors.accent : colors.textsecondary
            }
          />
          Borrowed Assets
        </button>
        <button
          className={`filter-btn ${selector === "lent" ? "active" : ""}`}
          onClick={() => setSelector("lent")}
        >
          <Stake
            color={selector === "lent" ? colors.accent : colors.textsecondary}
          />
          Lent Assets
        </button>
      </div>

      <div className="assets-container">
        {selector === "borrowed" ? (
          <div className="assets-grid">
            <BorrowedAsset
              owner="amschelll"
              asset="USDC"
              amount={200}
              usecase="staking"
              owneryielddist={40}
              receipientyielddist={60}
            />
            <BorrowedSecret
              owner="amschelll"
              secret="L9P0..."
              secretFee={22}
              secretType="POE"
            />
            <BorrowedAsset
              owner="mgustavh"
              asset="ETH"
              amount={0.75}
              usecase="staking"
              owneryielddist={50}
              receipientyielddist={50}
            />
          </div>
        ) : (
          <div className="assets-grid">
            {secretRevoked == null ? (
              <LentSecret
                borrower="amscelll"
                secret="L9P0..."
                secretType="POE"
                secretFee={0}
              />
            ) : (
              <div className="no-assets">
                <p>You have not lent any assets</p>
                <span>Start lending your assets to earn passive income</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="action-buttons">
        <SubmitButton
          text="Lend Crypto"
          icon={<Stake width={16} height={16} color={colors.textprimary} />}
          sxstyles={{
            ...buttonStyles,
            backgroundColor: colors.success,
          }}
          onclick={lendAsset}
        />
        <SubmitButton
          text="Lend Web2 Keys"
          icon={<Import width={16} height={16} color={colors.textprimary} />}
          sxstyles={{
            ...buttonStyles,
            backgroundColor: colors.accent,
          }}
          onclick={lendSecret}
        />
      </div>
    </section>
  );
}

const buttonStyles: CSSProperties = {
  padding: "0.75rem 1.5rem",
  borderRadius: "1.5rem",
  fontSize: "13px",
  fontWeight: "600",
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  transition: "all 0.3s ease",
};
