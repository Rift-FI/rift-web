import { JSX, useState } from "react";
import { useNavigate } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { BorrowedAsset } from "../../components/lend/Assets";
import { BorrowedSecret, LentSecret } from "../../components/lend/Secrets";
import "../../styles/pages/lendspend.scss";
import { ActivityChart } from "./ActivityChart";
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
  //No need for first time lend info page

  // useEffect(() => {
  //   const firsttimelend = localStorage.getItem("firsttimelend");

  //   if (firsttimelend == null) {
  //     navigate("/lend/info");
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  return (
    <section id="" className="bg-[#0e0e0e] h-screen px-4 overflow-y-scroll">
      <div className="mt-2">
        <h1 className="text-[#f6f7f9] text-xl font-bold">Lend & Earn</h1>
        <span className="text-sm text-gray-400 mb-2">
          Lend out your idle crypto assets and secrets
        </span>
        <div className="flex items-center justify-between my-2 gap-2">
          <div className="bg-[#212121] w-1/2 rounded-2xl h-24 flex flex-col items-center justify-center">
            <h1 className="text-[#32e15e] text-2xl font-bold my-2">$198.09</h1>
            <p className="text-gray-400 text-sm">Earnings</p>
          </div>
          <div className="bg-[#212121] w-1/2 rounded-2xl h-24 flex flex-col items-center justify-center">
            <h1 className="text-[#f41818] text-2xl font-bold my-2">$93.74</h1>
            <p className="text-gray-400 text-sm">Spending</p>
          </div>
        </div>
        <ActivityChart />
      </div>
      <div className="">
        <h1 className="text-[#f6f7f9] text-xl font-bold mt-4 mb-2">Assets</h1>
      </div>

      <div className="flex items-center gap-2 mb-2 justify-between bg-[#212121] border border-[#212121] p-2 px-2 rounded-2xl">
        <button
          className={`filter-btn ${
            selector === "borrowed"
              ? "bg-[#ffb386] border border-[#ffb386] p-2 rounded-xl flex items-center gap-2 text-sm w-1/2 justify-center"
              : "text-[#f6f7f9] flex items-center gap-2 text-sm"
          }`}
          onClick={() => setSelector("borrowed")}
        >
          Borrowed Assets
        </button>
        <button
          className={`filter-btn ${
            selector === "lent"
              ? "bg-[#ffb386] border border-[#ffb386] p-2 rounded-xl flex items-center gap-2 text-sm w-1/2 justify-center"
              : "text-[#f6f7f9] flex items-center gap-2 text-sm"
          }`}
          onClick={() => setSelector("lent")}
        >
          Lent Assets
        </button>
      </div>

      <div className="assets-container">
        {selector === "borrowed" ? (
          <div className="grid grid-cols-1 gap-4">
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
              <div className="flex items-center justify-center flex-col gap-2">
                <p className="text-gray-400 text-sm">
                  You have not lent any assets
                </p>
                <span className="text-gray-400 text-sm">
                  Start lending your assets to earn passive income
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 my-4 justify-between">
        <button
          className="flex items-center gap-2 text-sm bg-[#ffb386] border border-[#212121] p-3 rounded-xl text-[#0e0e0e] w-1/2 justify-center"
          onClick={lendAsset}
        >
          Lend Crypto
        </button>
        <button
          className="flex items-center gap-2 text-sm bg-[#212121] border border-[#ffb386] p-3 rounded-xl text-[#f6f7f9] w-1/2 justify-center"
          onClick={lendSecret}
        >
          Lend Keys
        </button>
      </div>
    </section>
  );
}
