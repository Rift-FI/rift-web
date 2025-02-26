import { JSX, MouseEvent, useEffect, useState } from "react";
import { backButton, retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { useNavigate, useParams } from "react-router";
import { Checkbox, Slider, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useSnackbar } from "../../hooks/snackbar";
import {
  fetchMyKeys,
  getkeysType,
  keyType,
  ShareKeyWithOtherUser,
} from "../../utils/api/keys";
import { formatUsd } from "../../utils/formatters";
import { PopOver } from "../../components/global/PopOver";
import { colors } from "../../constants";
import { assetType } from "./CreateLendAsset";
import { ChevronLeft, Import } from "../../assets/icons/actions";
import poelogo from "../../assets/images/icons/poe.png";
import stratosphere from "../../assets/images/sphere.jpg";
import awxlogo from "../../assets/images/awx.png";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import "../../styles/pages/createlendsecret.scss";

export type secretType = "POE" | "SPHERE" | "AIRWALLEX";

export default function CreateLendSecret(): JSX.Element {
  const navigate = useNavigate();
  const { type } = useParams();
  const { showerrorsnack, showsuccesssnack } = useSnackbar();

  let ethAddr = localStorage.getItem("address");
  let btcAddr = localStorage.getItem("btcaddress");
  let sphereId = `${ethAddr?.substring(2, 6)}${btcAddr?.substring(2, 6)}`;

  const [secretReceipient, setSecretReceipient] = useState<string>("");
  const [selSecretType, setSelSecretType] = useState<string>(type as string);
  const [selSecretValue, setSelSecretValue] = useState<string>(sphereId);
  const [secretFee, setSecretFee] = useState<string>("1");
  const [customFee, setCustomFee] = useState<string>("");
  const [anchorEl, setanchorEl] = useState<HTMLDivElement | null>(null);
  const [repayAsset, setRepayAsset] = useState<assetType>("HKD");
  const [repaymentAnchorEl, setRepaymentAnchorEl] =
    useState<HTMLDivElement | null>(null);
  const [time, setTime] = useState<number>(30);
  const [noExpiry, setNoExpiry] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);

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

  const { data } = useQuery({
    queryKey: ["secrets"],
    queryFn: fetchMyKeys,
  });

  const onShareKey = async () => {
    if (secretFee !== "0") {
      showerrorsnack("Sorry, you can only lend free keys!");
    } else {
      setProcessing(true);

      let token: string | null = localStorage.getItem("token");
      let { initData } = retrieveLaunchParams();

      const { isOk } = await ShareKeyWithOtherUser(
        token as string,
        String(selSecretValue).substring(0, 4),
        "foreign",
        selSecretValue as string,
        initData?.user?.username as string,
        noExpiry ? "1000d" : `${time}m`,
        secretReceipient,
        selSecretType as string
      );

      if (isOk) {
        showsuccesssnack("Key was lent successfully");
        goBack();
      } else {
        showerrorsnack("An unexpected error occurred");
      }

      setProcessing(false);
    }
  };

  let allKeys = data as getkeysType;
  let mykeys: keyType[] = allKeys?.keys?.map((_key: string) =>
    JSON.parse(_key)
  );
  let mysecrets = mykeys?.filter(
    (_scret: { type: string }) => _scret.type == "own"
  );

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
    <section id="createlendsecret">
      <p className="title">
        Lend Secrets <br />
        <span>Let others use your secrets at a fee</span>
      </p>

      <div className="secretselector" onClick={openPopOver}>
        <div className="img_desc">
          <img
            src={
              selSecretType == "POE" || selSecretType == "OPENAI"
                ? poelogo
                : selSecretType == "SPHERE"
                ? stratosphere
                : awxlogo
            }
            alt="secret"
          />

          <p className="desc">
            {selSecretType === "OPENAI" ? "POE" : selSecretType} <br />
            <span>{selSecretValue?.substring(0, 4) + "..."}</span>
          </p>
        </div>

        <span className="inv_icon">
          <ChevronLeft width={6} height={11} color={colors.textsecondary} />
        </span>
      </div>
      <PopOver anchorEl={anchorEl} setAnchorEl={setanchorEl}>
        <div className="select_secrets">
          <>
            {/* speher id */}
            <div
              className="img_desc"
              onClick={() => {
                setSelSecretType("SPHERE");
                setSelSecretValue(sphereId);
                setanchorEl(null);
              }}
            >
              <img src={stratosphere} alt="secret" />

              <p className="desc">
                SPHERE <br />
                <span>{sphereId.substring(0, 4) + "..."}</span>
              </p>
            </div>
            {/* other secrets/keys */}
            {mysecrets?.map((_key) => (
              <div
                className="img_desc"
                onClick={() => {
                  setSelSecretType(
                    _key?.purpose == "OPENAI" ? "POE" : _key?.purpose
                  );
                  setSelSecretValue(_key?.value);
                  setanchorEl(null);
                }}
              >
                <img
                  src={_key?.purpose == "OPENAI" ? poelogo : awxlogo}
                  alt="secret"
                />

                <p className="desc">
                  {_key?.purpose == "OPENAI" ? "POE" : _key?.purpose} <br />
                  <span>{_key?.value?.substring(0, 4) + "..."}</span>
                </p>
              </div>
            ))}
          </>
          <p id="asset_tle">Select the secret you would like to lend</p>
        </div>
      </PopOver>

      <div className="receipient">
        <p className="ttle">
          Receipient <br />
          <span>You can use their Telegram username</span>
        </p>

        <TextField
          value={secretReceipient}
          onChange={(ev) => setSecretReceipient(ev.target.value)}
          label="Receipient"
          placeholder="telegram username"
          fullWidth
          variant="outlined"
          autoComplete="off"
          type="text"
          sx={{
            marginTop: "0.75rem",
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: colors.divider,
              },
              "& input": {
                color: colors.textprimary,
              },
              "&::placeholder": {
                color: colors.textsecondary,
                opacity: 1,
              },
            },
            "& .MuiInputLabel-root": {
              color: colors.textsecondary,
              fontSize: "0.875rem",
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: colors.accent,
            },
          }}
        />
      </div>

      <div className="receipient fees">
        <div className="qfees">
          <button
            onClick={() => setSecretFee("0")}
            style={{
              backgroundColor: Number(secretFee) == 0 ? colors.accent : "",
            }}
          >
            {formatUsd(0)} (Free)
          </button>
          <button
            onClick={() => setSecretFee("1")}
            style={{
              backgroundColor: Number(secretFee) == 1 ? colors.accent : "",
            }}
          >
            {formatUsd(1)}
          </button>
          <button
            onClick={() => setSecretFee("12")}
            style={{
              backgroundColor: Number(secretFee) == 12 ? colors.accent : "",
            }}
          >
            {formatUsd(12)}
          </button>
          <button
            onClick={() => setSecretFee("18")}
            style={{
              backgroundColor: Number(secretFee) == 18 ? colors.accent : "",
            }}
          >
            {formatUsd(18)}
          </button>
        </div>
      </div>

      {secretFee == "0" ? (
        <>
          <p className="valid_minutes">
            Valid for {time} minutes
            <span>How long will the receipient have access to the key ?</span>
          </p>
          <Slider
            value={time}
            onChange={handleChange}
            marks={marks}
            step={null}
            min={30}
            max={90}
            valueLabelDisplay="on"
            slotProps={{ valueLabel: { style: { color: colors.textprimary } } }}
            sx={{
              marginTop: "1.5rem",
              "& .MuiSlider-markLabel": {
                fontSize: "0.75rem",
                color: colors.textprimary,
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

            <p>
              No Expiry <br />
              <span>The receipient will not lose access to the key</span>
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="receipient fees">
            <p className="ttle">
              Fee <br />
              <span>How much do you want to charge for the secret ?</span>
            </p>

            <p className="ttle customfeetle">
              Custom Fee <br />
              <span>Set a custom fee for the secret</span>
            </p>

            <TextField
              value={customFee}
              onChange={(ev) => setCustomFee(ev.target.value)}
              label="Custom fee"
              placeholder="custom secret fee"
              fullWidth
              variant="outlined"
              autoComplete="off"
              type="number"
              sx={{
                marginTop: "0.875rem",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: colors.divider,
                  },
                  "& input": {
                    color: colors.textprimary,
                  },
                  "&::placeholder": {
                    color: colors.textsecondary,
                    opacity: 1,
                  },
                },
                "& .MuiInputLabel-root": {
                  color: colors.textsecondary,
                  fontSize: "0.875rem",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: colors.accent,
                },
              }}
            />

            <p className="feeem">
              The receipient will pay&nbsp;
              <span>
                {customFee !== ""
                  ? formatUsd(Number(customFee))
                  : formatUsd(Number(secretFee))}
              </span>
              to use the secret
            </p>
          </div>
          <p className="repayment_tle">
            Payment Options
            <span>How do you wish to be paid for this secret ?</span>
          </p>
          <div
            className="repayment_curreny secretselector"
            onClick={secretFee == "0" ? () => {} : openRepaymentPopOver}
          >
            <div className="img_desc">
              {repayAsset == "HKD" || repayAsset == "USD" ? (
                <span className="country_flag">
                  {repayAsset == "HKD" ? "🇭🇰" : "🇺🇸"}
                </span>
              ) : (
                <img
                  src={
                    repayAsset == "BTC"
                      ? btclogo
                      : repayAsset == "ETH"
                      ? ethlogo
                      : usdclogo
                  }
                  alt="secret"
                />
              )}

              <p className="desc">{repayAsset}</p>
            </div>

            <span className="inv_icon">
              <ChevronLeft width={6} height={11} color={colors.textsecondary} />
            </span>
          </div>
          <PopOver
            anchorEl={repaymentAnchorEl}
            setAnchorEl={setRepaymentAnchorEl}
          >
            {
              <div className="select_secrets">
                <div
                  className="img_desc"
                  onClick={() => {
                    setRepayAsset("HKD");
                    setRepaymentAnchorEl(null);
                  }}
                >
                  <span className="_icons">🇭🇰</span>

                  <p className="desc">
                    HKD <br /> <span>Fiat</span>
                  </p>
                </div>

                <div
                  className="img_desc"
                  onClick={() => {
                    setRepayAsset("USD");
                    setRepaymentAnchorEl(null);
                  }}
                >
                  <span className="_icons">🇺🇸</span>

                  <p className="desc">
                    USD <br /> <span>Fiat</span>
                  </p>
                </div>

                <div
                  className="img_desc"
                  onClick={() => {
                    setRepayAsset("USDC");
                    setRepaymentAnchorEl(null);
                  }}
                >
                  <img src={usdclogo} alt="secret" />

                  <p className="desc">
                    USDC <br /> <span>Crypto (Stablecoin)</span>
                  </p>
                </div>

                <div
                  className="img_desc"
                  onClick={() => {
                    setRepayAsset("ETH");
                    setRepaymentAnchorEl(null);
                  }}
                >
                  <img src={ethlogo} alt="secret" />

                  <p className="desc">
                    ETH <br /> <span>Crypto</span>
                  </p>
                </div>

                <div
                  className="img_desc"
                  onClick={() => {
                    setRepayAsset("BTC");
                    setRepaymentAnchorEl(null);
                  }}
                >
                  <img src={btclogo} alt="secret" />

                  <p className="desc">
                    BTC <br /> <span>Crypto</span>
                  </p>
                </div>
              </div>
            }
          </PopOver>
        </>
      )}

      <button className="submit" disabled={processing} onClick={onShareKey}>
        Lend Secret <Import width={16} height={16} color={colors.textprimary} />
      </button>
    </section>
  );
}
