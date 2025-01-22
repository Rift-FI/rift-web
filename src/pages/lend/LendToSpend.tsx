import { JSX, useEffect, useState } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { BorrowedAsset } from "../../components/lend/Assets";
import { useTabs } from "../../hooks/tabs";
import { Stake } from "../../assets/icons";
import { colors } from "../../constants";
import "../../styles/pages/lendspend.css";

export default function LendToSpend(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const [selector, setSelector] = useState<"lent" | "borrowed">("borrowed");

  const goBack = () => {
    switchtab("earn");
    navigate("/");
  };

  const onLend = () => {
    navigate("/lend/new");
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
        <br /> <span>Lend out your idle crypto assets and earn yields</span>
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

      <button className="newlend" onClick={onLend}>
        <Stake width={14} height={14} color={colors.textprimary} />
      </button>
    </section>
  );
}
