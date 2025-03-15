import { CSSProperties, JSX, useState } from "react";
import { useNavigate } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { BorrowedAsset } from "../../components/lend/Assets";
import { BorrowedSecret, LentSecret } from "../../components/lend/Secrets";
import { VerticalDivider } from "../../components/global/Divider";
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
    navigate("/lend/secret/SPHERE");
  };

  useBackButton(goBack);

  return (
    <section id="lendtospend">
      <p className="title">
        Lend & Earn
        <br /> <span>Lend out your idle crypto assets and secrets</span>
      </p>

      <div className="selectors">
        <button
          style={{
            borderBottomColor:
              selector == "borrowed" ? colors.textsecondary : colors.primary,
            color:
              selector == "borrowed"
                ? colors.textprimary
                : colors.textsecondary,
          }}
          className="borrowed"
          onClick={() => setSelector("borrowed")}
        >
          Borrowed Assets
          <span>
            <Stake
              color={
                selector == "borrowed"
                  ? colors.textprimary
                  : colors.textsecondary
              }
            />
          </span>
        </button>

        <button
          style={{
            borderBottomColor:
              selector == "lent" ? colors.textsecondary : colors.primary,
            color:
              selector == "lent" ? colors.textprimary : colors.textsecondary,
          }}
          onClick={() => setSelector("lent")}
        >
          Lent Assets
          <span>
            <Stake
              color={
                selector == "lent" ? colors.textprimary : colors.textsecondary
              }
            />
          </span>
        </button>
      </div>

      <div id="assets">
        {selector == "borrowed" ? (
          <>
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
          </>
        ) : (
          <>
            {secretRevoked == null ? (
              <LentSecret
                borrower="amscelll"
                secret="L9P0..."
                secretType="POE"
                secretFee={0}
              />
            ) : (
              <p className="noassets">You have not lent any assets...</p>
            )}
          </>
        )}
      </div>

      <div className="newlendctr">
        <SubmitButton
          text="Lend Crypto"
          icon={<Stake width={10} height={10} color={colors.textprimary} />}
          sxstyles={buttonstyles}
          onclick={lendAsset}
        />

        <VerticalDivider sxstyles={{ backgroundColor: colors.textprimary }} />

        <SubmitButton
          text="Lend Web2 Keys"
          icon={<Import width={16} height={16} color={colors.textprimary} />}
          sxstyles={buttonstyles}
          onclick={lendSecret}
        />
      </div>
    </section>
  );
}

const buttonstyles: CSSProperties = {
  gap: "0.5rem",
  borderRadius: 0,
  backgroundColor: "transparent",
};
