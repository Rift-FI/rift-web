import { JSX, useEffect, useState } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { useTabs } from "../../hooks/tabs";
import { BorrowedAsset } from "../../components/lend/Assets";
import { BorrowedSecret } from "../../components/lend/Secrets";
import { Import, Stake } from "../../assets/icons";
import { colors } from "../../constants";
import "../../styles/pages/lendspend.css";

export default function LendToUse(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const [selector, setSelector] = useState<"lent" | "borrowed">("borrowed");

  const goBack = () => {
    switchtab("earn");
    navigate("/");
  };

  const lendAsset = () => {
    navigate("/lend/asset");
  };

  const lendSecret = () => {
    navigate("/lend/secret");
  };

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isVisible()) {
      backButton.onClick(goBack);
    }

    return () => {
      backButton.offClick(goBack);
      backButton.unmount();
    };
  }, []);

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
          <p className="noassets">You have not lent any assets...</p>
        )}
      </div>

      <div className="newlendctr">
        <button className="newlend" onClick={lendSecret}>
          <Import width={16} height={16} color={colors.textprimary} />
        </button>

        <button className="newlend" onClick={lendAsset}>
          <Stake width={10} height={10} color={colors.textprimary} />
        </button>
      </div>
    </section>
  );
}
