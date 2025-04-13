import { JSX } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";

import { SharedSecrets } from "../../components/Secrets";
import { fetchMyKeys } from "../../utils/api/keys";
import "../../styles/pages/lendspend.scss";
import { ActivityChart } from "./ActivityChart";
import { Loading } from "../../assets/animations";

export default function LendToUse(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const {
    data: allKeysData,
    isLoading: isLoadingKeys,
    isError: isKeysError,
  } = useQuery({
    queryKey: ["secrets"],
    queryFn: fetchMyKeys,
  });

  const borrowedKeys = allKeysData?.filter((key) => key?.nonce !== null) || [];

  const goBack = () => {
    switchtab("home");
    navigate("/");
  };

  useBackButton(goBack);

  return (
    <section
      id="lend-to-use"
      className="flex flex-col h-screen bg-[#212523] text-[#f6f7f9]"
    >
      <div className="flex-grow overflow-y-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-[#f6f7f9] text-xl font-bold">Borrow Keys</h1>
          <span className="text-sm text-gray-400 mb-2 block">
            Use API keys shared with you
          </span>
          <div className="flex items-center justify-between my-2 gap-2">
            <div className="bg-[#2a2e2c] border border-[#34404f] w-1/2 rounded-2xl h-24 flex flex-col items-center justify-center">
              <h1 className="text-[#7be891] text-2xl font-bold my-1">$0.00</h1>
              <p className="text-gray-400 text-xs">Total Saved</p>
            </div>
            <div className="bg-[#2a2e2c] border border-[#34404f] w-1/2 rounded-2xl h-24 flex flex-col items-center justify-center">
              <h1 className="text-[#f87171] text-2xl font-bold my-1">$0.00</h1>
              <p className="text-gray-400 text-xs">Total Spent</p>
            </div>
          </div>
          <ActivityChart />
        </div>

        <div>
          <h1 className="text-[#f6f7f9] text-xl font-bold mt-4 mb-2">
            Borrowed Keys
          </h1>

          <div className="assets-container min-h-[100px]">
            {isLoadingKeys ? (
              <div className="flex justify-center items-center h-full py-10">
                <Loading width="2rem" height="2rem" />
              </div>
            ) : isKeysError ? (
              <div className="text-center py-10 px-4 bg-[#2a2e2c] rounded-xl border border-red-500/50">
                <p className="text-red-400 text-sm">
                  Error loading keys. Please try again later.
                </p>
              </div>
            ) : borrowedKeys.length > 0 ? (
              <SharedSecrets secretsLs={borrowedKeys} />
            ) : (
              <div className="text-center py-10 px-4 bg-[#2a2e2c] rounded-xl border border-[#34404f]">
                <p className="text-gray-400 text-sm">
                  You haven't borrowed any keys yet.
                </p>
                <p className="text-gray-400 text-xs mt-1 block">
                  Keys shared with you will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
