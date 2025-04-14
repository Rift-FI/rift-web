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
import { SubmitButton } from "../../components/global/Buttons";
import { ChevronLeft } from "../../assets/icons/actions";
import airwallex from "../../assets/images/awx.png";

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
    showerrorsnack("Airwallex deposit feature is coming soon.");
  };

  const goBack = () => {
    navigate("/deposit");
  };

  useBackButton(goBack);

  return (
    <div className="flex flex-col h-screen bg-[#212523] text-[#f6f7f9]">
      <div className="flex items-center gap-4 px-4 pt-6 pb-4 shrink-0 border-b border-[#34404f]">
        <div onClick={goBack} className="cursor-pointer p-1">
          <ChevronLeft width={18} height={18} color="#f6f7f9" />
        </div>
        <h1 className="text-lg font-semibold text-[#f6f7f9]">
          Deposit from Airwallex
        </h1>
      </div>

      <div className="flex-grow overflow-y-auto px-4 py-6 space-y-6">
        {airwallexData?.status === 404 ? (
          <div className="space-y-4">
            <h2 className="text-[#f6f7f9] text-lg font-medium">
              Import Airwallex API Key
            </h2>
            <p className="text-gray-400 text-sm">
              An Airwallex key allows you to view your USD & HKD balances and
              deposit funds directly.
            </p>
            <button
              onClick={onimportAwx}
              className="w-full flex items-center justify-between p-4 bg-[#2a2e2c] rounded-xl border border-[#34404f] hover:bg-[#34404f] transition-colors"
            >
              <span className="text-[#f6f7f9] font-medium">
                Import AirWallex Key
              </span>
              <img src={airwallex} alt="airwallex" className="h-6" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Select Key
              </label>
              <div
                onClick={openPopOver}
                className="flex items-center justify-between p-3 bg-[#2a2e2c] rounded-xl border border-[#34404f] cursor-pointer hover:bg-[#34404f] transition-colors"
              >
                <div className="flex items-center gap-3 truncate">
                  <img
                    src={airwallex}
                    alt="key icon"
                    className="h-6 shrink-0"
                  />
                  <p className="text-[#f6f7f9] font-medium truncate">
                    {selectKey === ""
                      ? "Please choose a key"
                      : selectKey.substring(0, 16) + "..."}
                  </p>
                </div>
                <ChevronLeft width={12} height={12} color="#9CA3AF" />
              </div>
              <PopOver anchorEl={anchorEl} setAnchorEl={setanchorEl}>
                <div className="bg-[#2a2e2c] p-2 rounded-lg shadow-lg border border-[#34404f] max-h-60 overflow-y-auto w-72">
                  {myAwxKeys?.length ? (
                    myAwxKeys?.map((key) => (
                      <div
                        key={key.id}
                        onClick={() => {
                          setSelectKey(key.value);
                          setanchorEl(null);
                        }}
                        className="cursor-pointer hover:bg-[#34404f] p-3 rounded-lg transition-colors text-[#f6f7f9] text-sm truncate"
                      >
                        {key.value}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm p-3 text-center">
                      No Airwallex keys found.
                    </p>
                  )}
                </div>
              </PopOver>
            </div>

            {selectKey !== "" && airwallexData && airwallexData.balances && (
              <div className="space-y-4">
                <h2 className="text-[#f6f7f9] text-lg font-medium">
                  Available Balances
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#2a2e2c] rounded-xl p-4 border border-[#34404f]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🇭🇰</span>
                      <p className="text-[#f6f7f9] font-medium">HKD</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-[#f6f7f9] text-xl font-bold">
                        {airwallexData?.balances?.balances?.HKD?.toFixed(2) ||
                          "0.00"}
                      </p>
                      <span className="text-gray-400 text-sm">HKD</span>
                    </div>
                  </div>

                  <div className="bg-[#2a2e2c] rounded-xl p-4 border border-[#34404f]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🇺🇸</span>
                      <p className="text-[#f6f7f9] font-medium">USD</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-[#f6f7f9] text-xl font-bold">
                        {airwallexData?.balances?.balances?.USD?.toFixed(2) ||
                          "0.00"}
                      </p>
                      <span className="text-gray-400 text-sm">USD</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectKey !== "" && (
              <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium text-gray-400">
                  Amount to deposit
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    inputMode="decimal"
                    className="flex-grow bg-[#2a2e2c] text-[#f6f7f9] px-4 py-3 rounded-xl border border-[#34404f] outline-none focus:border-[#ffb386] placeholder-gray-500"
                    placeholder="0.00"
                    value={selectCurrencyAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*\.?\d*$/.test(value)) {
                        setSelectCurrencyAmount(value);
                      }
                    }}
                  />
                  <button
                    onClick={(e) => openCurrencyPopOver(e as any)}
                    className="shrink-0 flex items-center gap-2 p-3 bg-[#2a2e2c] rounded-xl border border-[#34404f] cursor-pointer hover:bg-[#34404f] transition-colors"
                  >
                    <span className="text-[#f6f7f9] text-sm font-medium">
                      {selectCurrency}
                    </span>
                    <ChevronLeft width={10} height={10} color="#9CA3AF" />
                  </button>

                  <PopOverAlt
                    anchorEl={currencyAnchorEl}
                    setAnchorEl={setCurrencyAnchorEl}
                  >
                    <div className="bg-[#2a2e2c] p-2 rounded-lg shadow-lg border border-[#34404f] w-24">
                      {["HKD", "USD"].map((currency) => (
                        <div
                          key={currency}
                          onClick={() => {
                            setSelectCurrency(currency as "USD" | "HKD");
                            setCurrencyAnchorEl(null);
                          }}
                          className="cursor-pointer hover:bg-[#34404f] p-2 rounded-lg transition-colors text-center text-[#f6f7f9] text-sm"
                        >
                          {currency}
                        </div>
                      ))}
                    </div>
                  </PopOverAlt>
                </div>
              </div>
            )}

            {target === "other" && selectKey !== "" && (
              <div className="space-y-2">
                <h3 className="text-[#f6f7f9] font-medium">Recipient</h3>
                <p className="text-gray-400 text-sm">
                  Enter the recipient's Telegram username.
                </p>
                <OutlinedTextInput
                  inputType="text"
                  placeholder="@username"
                  inputlabalel="Recipient Username"
                  inputState={receipient}
                  setInputState={setReceipient}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 p-4 bg-[#212523] border-t border-[#34404f]">
        <SubmitButton
          text={`Deposit with ${selectCurrency}`}
          isDisabled={
            airwallexData?.status === 404 ||
            selectKey === "" ||
            selectCurrencyAmount === "" ||
            Number(selectCurrencyAmount) <= 0 ||
            (target === "other" && receipient === "")
          }
          onclick={onSubmitDeposit}
          sxstyles={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "2rem",
            fontSize: "0.875rem",
            fontWeight: "bold",
          }}
        />
      </div>
    </div>
  );
}
