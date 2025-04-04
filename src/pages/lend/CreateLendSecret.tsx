import { JSX, MouseEvent, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Checkbox, Slider } from "@mui/material";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { useBackButton } from "../../hooks/backbutton";
import { useAppDrawer } from "../../hooks/drawer";
import { useSnackbar } from "../../hooks/snackbar";
import { fetchMyKeys, lendmyKey } from "../../utils/api/keys";
import { CurrencyPopOver, PopOver } from "../../components/global/PopOver";
import { SubmitButton } from "../../components/global/Buttons";
import { BottomButtonContainer } from "../../components/Bottom";
import { OutlinedTextInput } from "../../components/global/Inputs";
import { colors } from "../../constants";
import { assetType } from "./CreateLendAsset";
import { FaIcon } from "../../assets/faicon";
import { Import } from "../../assets/icons/actions";
import poelogo from "../../assets/images/icons/poe.png";
import awxlogo from "../../assets/images/awx.png";
import polymarketlogo from "../../assets/images/icons/polymarket.png";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import wusdlogo from "../../assets/images/wusd.png";
import mantralogo from "../../assets/images/labs/mantralogo.jpeg";
import "../../styles/pages/createlendsecret.scss";

export type secretType = "POE" | "OPENAI" | "AIRWALLEX" | "POLYMARKET";

export default function CreateLendSecret(): JSX.Element {
  const navigate = useNavigate();
  const { type, secretvalue } = useParams();
  const { openAppDrawerWithKey } = useAppDrawer();
  const { showerrorsnack } = useSnackbar();

  const [selSecretType, setSelSecretType] = useState<string>(type as string);
  const [selSecretValue, setSelSecretValue] = useState<string>(
    secretvalue as string
  );
  const [secretFee, setSecretFee] = useState<string>("1");
  const [customFee, setCustomFee] = useState<string>("");
  const [receipient, setReceipient] = useState<string>("");
  const [anchorEl, setanchorEl] = useState<HTMLDivElement | null>(null);
  const [repayAsset, setRepayAsset] = useState<assetType>("OM");
  const [repaymentAnchorEl, setRepaymentAnchorEl] =
    useState<HTMLDivElement | null>(null);
  const [time, setTime] = useState<number>(30);
  const [noExpiry, setNoExpiry] = useState<boolean>(false);

  const marks = [
    { value: 30, label: "30" },
    { value: 60, label: "60" },
    { value: 90, label: "90" },
  ];

  const handleChange = (_event: Event, newValue: number | number[]) => {
    setTime(newValue as number);
  };

  const openPopOver = (event: MouseEvent<HTMLDivElement>) => {
    setanchorEl(event.currentTarget);
  };

  const openRepaymentPopOver = (event: MouseEvent<HTMLDivElement>) => {
    setRepaymentAnchorEl(event.currentTarget);
  };

  const goBack = () => {
    navigate("/lend");
  };

  const { data: mykeys } = useQuery({
    queryKey: ["secrets"],
    queryFn: fetchMyKeys,
  });

  const { mutate: onLendKey, isPending: lendloading } = useMutation({
    mutationFn: () =>
      lendmyKey(
        selSecretValue,
        receipient,
        noExpiry ? `8700h` : `${time}m`,
        selSecretType,
        secretFee,
        repayAsset
      )
        .then((res) => {
          if (res?.data) {
            openAppDrawerWithKey("sendlendlink", res?.data, "Key"); // action : link : Key or Crypto
          } else {
            showerrorsnack("Failed to lend you key, please try again");
          }
        })
        .catch(() => {
          showerrorsnack("Failed to lend your key, please try again");
        }),
  });

  const mysecrets = mykeys?.filter((_key) => _key?.url == null);

  useBackButton(goBack);

  return (
    <section id="" className="h-screen bg-[#0e0e0e] px-4">
      <p className="text-[#f6f7f9] text-xl font-bold mb-8 mt-4">
        Lend Web2 Keys
        <br />
        <span className="text-sm text-gray-400">
          Let others use your keys at a fee
        </span>
      </p>

      {mysecrets || [].length >= 1 ? (
        <div className="secretselector" onClick={openPopOver}>
          {selSecretType === "nil" || selSecretValue === "nil" ? (
            <p className="choose_key">
              Please choose a key to lend
              <span>You have {mysecrets?.length} key(s)</span>{" "}
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 bg-[#212121] border border-[#212121] p-2 rounded-2xl my-2">
                <img
                  src={
                    selSecretType == "POE" || selSecretType == "OPENAI"
                      ? poelogo
                      : selSecretType == "POLYMARKET"
                      ? polymarketlogo
                      : awxlogo
                  }
                  alt="secret"
                  className="w-10 h-10 rounded-full object-cover"
                />

                <p className="text-sm text-[#f6f7f9]">
                  {selSecretType}
                  <br />
                  <span>{selSecretValue?.substring(0, 4) + "..."}</span>
                </p>
              </div>
              {/* 
              <span className="inv_icon">
                <ChevronLeft
                  width={6}
                  height={11}
                  color={colors.textsecondary}
                />
              </span> */}
            </>
          )}
        </div>
      ) : (
        <p
          className="text-sm text-gray-400 my-4"
          onClick={() => navigate("/web2")}
        >
          Please import your web2 Keys to lend them
          <FaIcon faIcon={faPlusCircle} color={"#ffb386"} fontsize={12} />
        </p>
      )}
      <PopOver anchorEl={anchorEl} setAnchorEl={setanchorEl}>
        <div className="select_secrets">
          {mysecrets?.map((_key) => (
            <div
              className="img_desc"
              key={_key?.id}
              onClick={() => {
                setSelSecretType(_key?.purpose);
                setSelSecretValue(_key?.value);
                setanchorEl(null);
              }}
            >
              <img
                src={
                  _key?.purpose == "OPENAI"
                    ? poelogo
                    : _key?.purpose == "POLYMARKET"
                    ? polymarketlogo
                    : awxlogo
                }
                alt="secret"
              />

              <p className="desc">
                {_key?.purpose} <br />
                <span>{_key?.value?.substring(0, 4) + "..."}</span>
              </p>
            </div>
          ))}
        </div>
      </PopOver>

      <p className="text-[#f6f7f9] mt-8">
        Recipient <br />{" "}
        <span className="text-sm text-gray-400">Lend secret via Telegram</span>
      </p>
      <OutlinedTextInput
        inputType="text"
        placeholder="Telegram ID"
        inputlabalel="Telegram ID"
        inputState={receipient}
        setInputState={setReceipient}
        sxstyles={{ marginTop: "0.875rem" }}
      />

      <p className="font-bold text-[#f6f7f9] mt-8">Fee</p>
      <span className="text-sm text-gray-400">
        How much do you want to charge for the secret ?
      </span>
      <div className="my-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSecretFee("0")}
            style={{
              backgroundColor: Number(secretFee) == 0 ? "#ffb386" : "",
              color: Number(secretFee) == 0 ? "#0e0e0e" : "",
            }}
            className="border border-[#ffb386] text-sm text-[#ffb386] rounded-md p-2 w-[20%]"
          >
            FREE
          </button>
          <button
            onClick={() => setSecretFee("1")}
            style={{
              backgroundColor: Number(secretFee) == 1 ? "#ffb386" : "",
              color: Number(secretFee) == 1 ? "#0e0e0e" : "",
            }}
            className="border border-[#ffb386] text-sm text-[#ffb386] rounded-md p-2 w-[20%]"
          >
            1 {repayAsset}
          </button>
          <button
            onClick={() => setSecretFee("12")}
            style={{
              backgroundColor: Number(secretFee) == 12 ? "#ffb386" : "",
              color: Number(secretFee) == 12 ? "#0e0e0e" : "",
            }}
            className="border border-[#ffb386] text-sm text-[#ffb386] rounded-md p-2 w-[20%]"
          >
            12 {repayAsset}
          </button>
          <button
            onClick={() => setSecretFee("18")}
            style={{
              backgroundColor: Number(secretFee) == 18 ? "#ffb386" : "",
              color: Number(secretFee) == 18 ? "#0e0e0e" : "",
            }}
            className="border border-[#ffb386] text-sm text-[#ffb386] rounded-md p-2 w-[20%]"
          >
            18 {repayAsset}
          </button>
        </div>
      </div>

      {secretFee == "0" ? (
        <>
          <p className="mt-4 text-sm text-[#f6f7f9]">
            Valid for {time} minutes
          </p>
          <span className="text-xs text-gray-400">
            How long will the recipient have access to the key ?
          </span>
          <Slider
            value={time}
            onChange={handleChange}
            marks={marks}
            step={null}
            min={30}
            max={90}
            valueLabelDisplay="on"
            slotProps={{ valueLabel: { style: { color: "#f6f7f9" } } }}
            sx={{
              marginTop: "1.5rem",
              "& .MuiSlider-markLabel": {
                fontSize: "0.75rem",
                color: "#f6f7f9",
              },
              "& .MuiSlider-thumb": {
                backgroundColor: colors.accent,
              },
              "& .MuiSlider-track": {
                backgroundColor: colors.accent,
              },
              "& .MuiSlider-rail": {
                backgroundColor: colors.textsecondary,
              },
              "& .MuiSlider-valueLabel": {
                fontSize: "0.625rem",
                color: colors.textprimary,
                backgroundColor: colors.accent,
              },
            }}
          />

          <div className="noexpiry">
            <Checkbox
              checked={noExpiry}
              onChange={(e) => setNoExpiry(e.target.checked)}
              disableRipple
              sx={{
                color: colors.textsecondary,
                paddingLeft: "unset",
                "&.Mui-checked": {
                  color: colors.accent,
                },
              }}
            />

            <p className="text-sm text-[#f6f7f9] mt-2">
              No Expiry <br />
            </p>
            <span className="text-xs text-gray-400">
              The recipient will not lose access to the key
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="">
            <p className="text-sm text-[#f6f7f9] mt-8">
              Custom Fee <br />
            </p>
            <span className="text-xs text-gray-400">
              Set a custom fee for the secret
            </span>

            <OutlinedTextInput
              inputType="number"
              placeholder={`10 ${repayAsset}`}
              inputlabalel="Custom fee"
              inputState={customFee}
              setInputState={setCustomFee}
              sxstyles={{ marginTop: "0.875rem" }}
            />

            <p className="feeem">
              The receipient will pay&nbsp;
              <span>
                {customFee !== ""
                  ? `${customFee} ${repayAsset}`
                  : `${secretFee} ${repayAsset}`}
              </span>
              &nbsp;to use the secret
            </p>
          </div>

          <p className="text-sm text-[#f6f7f9] mt-2">Payment Options</p>
          <span className="text-xs text-gray-400 mb-2">
            How do you wish to be paid for this secret ?
          </span>
          <div
            className="repayment_curreny secretselector"
            onClick={secretFee == "0" ? () => {} : openRepaymentPopOver}
          >
            <div className="flex items-center gap-2 bg-[#212121] border border-[#212121] p-2 rounded-2xl my-2">
              {repayAsset == "HKD" ||
              repayAsset == "USD" ||
              repayAsset == "HKDA" ? (
                <span className="country_flag">
                  {repayAsset == "HKD" || repayAsset == "HKDA" ? "🇭🇰" : "🇺🇸"}
                </span>
              ) : (
                <img
                  src={
                    repayAsset == "BTC"
                      ? btclogo
                      : repayAsset == "ETH"
                      ? ethlogo
                      : repayAsset == "WUSD"
                      ? wusdlogo
                      : repayAsset == "OM"
                      ? mantralogo
                      : usdclogo
                  }
                  alt="secret"
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}

              <p className="text-[#f6f7f9]">{repayAsset}</p>
            </div>

            {/* <span className="inv_icon">
              <ChevronLeft width={6} height={11} color={colors.textsecondary} />
            </span> */}
          </div>
          <CurrencyPopOver
            anchorEl={repaymentAnchorEl}
            setAnchorEl={setRepaymentAnchorEl}
            setCurrency={setRepayAsset}
          />
        </>
      )}

      <BottomButtonContainer>
        <SubmitButton
          text="Lend Key"
          icon={
            <Import
              width={16}
              height={16}
              color={
                selSecretType === "nil" ||
                selSecretValue === "nil" ||
                lendloading
                  ? colors.textsecondary
                  : colors.textprimary
              }
            />
          }
          sxstyles={{
            padding: "0.625rem",
            borderRadius: "1.5rem",
            backgroundColor:
              selSecretType === "nil" || selSecretValue === "nil" || lendloading
                ? colors.divider
                : colors.success,
          }}
          isDisabled={
            selSecretType === "nil" || selSecretValue === "nil" || lendloading
          }
          isLoading={lendloading}
          onclick={onLendKey}
        />
      </BottomButtonContainer>
    </section>
  );
}
