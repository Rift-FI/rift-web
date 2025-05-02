import { JSX } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { useAppDrawer } from "@/hooks/drawer";
import { SharedSecrets } from "../../components/Secrets";
import {
  fetchMyKeys,
  getKeyEarnings,
  getMyLendKeys,
  keyType,
} from "../../utils/api/keys";
import { Loading } from "../../assets/animations";
import { formatUsd } from "@/utils/formatters";
import { SubmitButton } from "@/components/global/Buttons";
import { BottomButtonContainer } from "@/components/Bottom";
import openailogo from "../../assets/images/openai-alt.png";
import "../../styles/pages/lendspend.scss";

// Define a type for the API response that includes the empty case
type FetchKeysResponse = keyType[] | { message: string };

export default function LendToUse(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { openAppDrawerWithKey } = useAppDrawer();

  const {
    data: allKeysData,
    isLoading: isLoadingKeys,
    isError: isKeysError,
  } = useQuery<FetchKeysResponse, Error>({
    queryKey: ["secrets"],
    queryFn: fetchMyKeys,
  });
  const { data: mylendkeys } = useQuery({
    queryKey: ["mylendkeys"],
    queryFn: getMyLendKeys,
  });

  // Check if allKeysData is an array before filtering
  const borrowedKeys = Array.isArray(allKeysData)
    ? allKeysData.filter((key: keyType) => key?.nonce !== null)
    : []; // If not an array (e.g., {message: ...}), treat as empty

  const { data: mykeyearnings } = useQuery({
    queryKey: ["keyearnings"],
    queryFn: getKeyEarnings,
  });

  const goBack = () => {
    switchtab("home");
    // navigate("/");
  };

  useBackButton(goBack);

  return (
    <section id="lendtospend">
      <div className="flex-grow overflow-y-auto px-4 py-6 space-y-6 lendctr">
        <div>
          <h1 className="text-[#f6f7f9] text-xl font-bold">Borrow Keys</h1>
          <span className="text-sm text-gray-400 mb-2 block">
            Use API keys shared with you
          </span>
          <div className="flex items-center justify-center my-2 gap-2">
            <div className="bg-[#2a2e2c] border border-[#34404f] w-1/2 rounded-2xl h-24 flex flex-col items-center justify-center">
              <h1 className="text-[#7be891] text-2xl font-bold my-1">
                {formatUsd(mykeyearnings?.totalEarnings || 0)}
              </h1>
              <p className="text-gray-400 text-xs">Total Earned</p>
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-[#f6f7f9] text-xl font-bold my-1">
            Borrowed Keys
          </h1>

          <div className="assets-container">
            {isLoadingKeys ? (
              <div className="flex justify-center items-center h-full">
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

        <div className="lendkeys">
          <h1 className="text-[#f6f7f9] text-xl font-bold">Lent Keys</h1>

          <div className="lentkeys">
            {mylendkeys?.length == 0 ? (
              <p className="text-gray-400 text-xs">
                Keys you have lent will appear here.
              </p>
            ) : (
              mylendkeys
                ?.filter((_key) => _key?.paymentValue > 0)
                ?.map((lentkey, idx) => (
                  <div
                    key={lentkey?.id + idx}
                    className="lent_key"
                    onClick={() =>
                      openAppDrawerWithKey(
                        "revokesecretaccess",
                        lentkey?.nonce as string,
                        lentkey?.purpose
                      )
                    }
                  >
                    <span className="img_purpose">
                      <img src={openailogo} alt="LENT KEY" />
                      <p>
                        {lentkey?.purpose}
                        <span>{lentkey?.value?.substring(0, 4) + "..."}</span>
                      </p>
                    </span>

                    <button className="revoke">Revoke Access</button>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      <BottomButtonContainer
        sxstyles={{
          bottom: "5rem",
          border: "0",
          backgroundColor: "transparent",
        }}
      >
        <SubmitButton
          text="Lend Keys"
          onclick={() => navigate("/lend/secret/nil/nil")}
          sxstyles={{ padding: "0.625rem", borderRadius: "0.5rem" }}
        />
      </BottomButtonContainer>
    </section>
  );
}
