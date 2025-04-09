import { JSX, MouseEvent, useState } from "react";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAirWllxBalances } from "../../utils/api/awllx";
import { useBackButton } from "../../hooks/backbutton";
import { useAppDialog } from "../../hooks/dialog";
import { useSnackbar } from "../../hooks/snackbar";
import { fetchMyKeys } from "../../utils/api/keys";
import { OutlinedTextInput } from "../../components/global/Inputs";
import { PopOver, PopOverAlt } from "../../components/global/PopOver";
import { ComingSoon } from "../transactions/Swap";
import { ChevronLeft } from "../../assets/icons/actions";
import airwallex from "../../assets/images/awx.png";
import "../../styles/pages/deposit/depositfromawx.scss";

export default function DepositFromAwx(): JSX.Element {
  const navigate = useNavigate();
  const { initData } = useLaunchParams();
  const { target } = useParams();
  const { openAppDialog } = useAppDialog();
  const { showerrorsnack } = useSnackbar();

  const [anchorEl, setanchorEl] = useState<HTMLDivElement | null>(null);
  const [currencyAnchorEl, setCurrencyAnchorEl] =
    useState<HTMLDivElement | null>(null);
  const [selectKey, setSelectKey] = useState<string>("");
  const [selectCurrency, setSelectCurrency] = useState<"USD" | "HKD">("HKD");
  const [selectCurrencyAmount, setSelectCurrencyAmount] = useState<string>("");
  const [receipient, setReceipient] = useState<string>("");

  const { data: airwallexData } = useQuery({
    queryKey: ["airwallexbalances"],
    queryFn: () => fetchAirWllxBalances(initData?.user?.username as string),
  });

  const { data: mykeys } = useQuery({
    queryKey: ["secrets"],
    queryFn: fetchMyKeys,
  });

  const myAwxKeys = mykeys?.filter((key) => key.purpose !== "OPENAI");

  const openPopOver = (event: MouseEvent<HTMLDivElement>) => {
    setanchorEl(event.currentTarget);
  };

  const openCurrencyPopOver = (event: MouseEvent<HTMLDivElement>) => {
    setCurrencyAnchorEl(event.currentTarget);
  };

  const onimportAwx = () => {
    openAppDialog("awxkeyimport", "Import AirWallex API Key");
  };

  const onSubmitDeposit = () => {
    showerrorsnack("Feature coming soon");
  };

  const goBack = () => {
    navigate("/deposit");
  };

  useBackButton(goBack);

  return (
    <div className="min-h-screen bg-[#0e0e0e] px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <div onClick={() => navigate(-1)}>
          <ChevronLeft />
        </div>
        <h1 className="text-2xl font-bold text-[#f6f7f9]">
          Deposit from Airwallex
        </h1>
      </div>

      <div className="space-y-6">
        <div>
          <div className="text-sm text-gray-400 mb-2">Select Key</div>
          <div onClick={openPopOver} className="cursor-pointer">
            <button className="w-full flex items-center justify-between p-3 bg-[#212121] rounded-xl">
              <span className="text-[#f6f7f9] font-medium">
                {selectKey || "Select Key"}
              </span>
              <ChevronLeft color="#9CA3AF" />
            </button>
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-400 mb-2">Select Currency</div>
          <div onClick={openCurrencyPopOver} className="cursor-pointer">
            <button className="w-full flex items-center justify-between p-3 bg-[#212121] rounded-xl">
              <span className="text-[#f6f7f9] font-medium">
                {selectCurrency}
              </span>
              <ChevronLeft color="#9CA3AF" />
            </button>
          </div>
        </div>

        {airwallexData?.status !== 404 && (
          <h2 className="text-[#f6f7f9] text-lg font-medium mb-4">
            Choose an Airwallex API Key
          </h2>
        )}

        {airwallexData?.status == 404 ? (
          <>
            <p className="text-gray-400 text-sm mb-6">
              An Airwallex key allows you to view your USD & HKD balances and
              buy OM (using USD/HKD)
            </p>

            <button
              onClick={onimportAwx}
              className="w-full flex items-center justify-between p-4 bg-[#212121] rounded-xl hover:bg-[#2a2a2a] transition-colors"
            >
              <span className="text-[#f6f7f9] font-medium">
                Import AirWallex Key
              </span>
              <img src={airwallex} alt="airwallex" className="h-6" />
            </button>
          </>
        ) : (
          <>
            <div
              onClick={openPopOver}
              className="flex items-center justify-between p-4 bg-[#212121] rounded-xl mb-6 cursor-pointer hover:bg-[#2a2a2a] transition-colors"
            >
              <div className="flex items-center gap-3">
                <img src={airwallex} alt="secret" className="h-6" />
                <p className="text-[#f6f7f9] font-medium">
                  {selectKey == ""
                    ? "Please choose a key"
                    : selectKey.substring(0, 16) + "..."}
                </p>
              </div>
              <ChevronLeft width={6} height={11} color="#9CA3AF" />
            </div>
            <PopOver anchorEl={anchorEl} setAnchorEl={setanchorEl}>
              <div className="p-4 space-y-4">
                {myAwxKeys?.map((key) => (
                  <div
                    key={key.id}
                    onClick={() => {
                      setSelectKey(key.value);
                      setanchorEl(null);
                    }}
                    className="cursor-pointer hover:bg-[#2a2a2a] p-2 rounded-lg transition-colors"
                  >
                    {key.value}
                  </div>
                ))}
              </div>
            </PopOver>
          </>
        )}
        <ComingSoon />

        {airwallexData?.status !== 404 && selectKey !== "" && (
          <>
            <h2 className="text-[#f6f7f9] text-lg font-medium mt-6 mb-4">
              Available Balances
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#212121] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🇭🇰</span>
                  <p className="text-[#f6f7f9] font-medium">HKD</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-[#f6f7f9] text-xl font-bold">
                    {airwallexData?.balances?.balances?.HKD.toFixed(2) || 0}
                  </p>
                  <span className="text-gray-400">HKD</span>
                </div>
              </div>

              <div className="bg-[#212121] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🇺🇸</span>
                  <p className="text-[#f6f7f9] font-medium">USD</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-[#f6f7f9] text-xl font-bold">
                    {airwallexData?.balances?.balances?.USD.toFixed(2) || 0}
                  </p>
                  <span className="text-gray-400">USD</span>
                </div>
              </div>
            </div>

            <h2 className="text-[#f6f7f9] text-lg font-medium mb-4">
              Amount to deposit
            </h2>
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                inputMode="numeric"
                className="flex-1 bg-[#212121] text-[#f6f7f9] px-4 py-3 rounded-xl outline-none placeholder-gray-400"
                placeholder={`200 ${selectCurrency}`}
                max={10}
                maxLength={10}
                value={selectCurrencyAmount}
                onChange={(e) => setSelectCurrencyAmount(e.target.value)}
              />

              <PopOverAlt
                anchorEl={currencyAnchorEl}
                setAnchorEl={setCurrencyAnchorEl}
              >
                <div className="p-4 space-y-4">
                  {["HKD", "USD"].map((currency) => (
                    <div
                      key={currency}
                      onClick={() => {
                        setSelectCurrency(currency as "USD" | "HKD");
                        setCurrencyAnchorEl(null);
                      }}
                      className="cursor-pointer hover:bg-[#2a2a2a] p-2 rounded-lg transition-colors"
                    >
                      {currency}
                    </div>
                  ))}
                </div>
              </PopOverAlt>
            </div>

            {target === "other" && (
              <div className="mb-6">
                <div className="mb-4">
                  <h3 className="text-[#f6f7f9] font-medium mb-1">Recipient</h3>
                  <p className="text-gray-400 text-sm">
                    You can use their Telegram username
                  </p>
                </div>

                <OutlinedTextInput
                  inputType="text"
                  placeholder="telegram username"
                  inputlabalel="Recipient"
                  inputState={receipient}
                  setInputState={setReceipient}
                  sxstyles={{ marginTop: "0.75rem" }}
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0e0e0e]">
        <button
          onClick={onSubmitDeposit}
          disabled={
            airwallexData?.status == 404 ||
            selectKey == "" ||
            selectCurrencyAmount == ""
          }
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors ${
            airwallexData?.status == 404 ||
            selectKey == "" ||
            selectCurrencyAmount == ""
              ? "bg-[#212121] text-gray-400"
              : "bg-[#7be891] text-[#0e0e0e] hover:opacity-90"
          }`}
        >
          <span>Deposit with {selectCurrency}</span>
        </button>
      </div>
    </div>
  );
}
