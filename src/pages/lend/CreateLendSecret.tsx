import { JSX, MouseEvent, useEffect, useState } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { TextField } from "@mui/material";
import { PopOver } from "../../components/global/PopOver";
import { formatUsd } from "../../utils/formatters";
import { colors } from "../../constants";
import { ChevronLeft, Import } from "../../assets/icons/actions";
import poelogo from "../../assets/images/icons/poe.png";
import openailogo from "../../assets/images/openai-alt.png";
import awxlogo from "../../assets/images/awx.png";
import "../../styles/pages/createlendsecret.scss";

export type secretType = "POE" | "OPENAI" | "AIRWALLEX";

export default function CreateLendSecret(): JSX.Element {
  const navigate = useNavigate();

  const [secretReceipient, setSecretReceipient] = useState<string>("");
  const [selSecretType, setSelSecretType] = useState<secretType>("POE");
  const [secretFee, setSecretFee] = useState<string>("1");
  const [customFee, setCustomFee] = useState<string>("");
  const [anchorEl, setanchorEl] = useState<HTMLDivElement | null>(null);

  const openPopOver = (event: MouseEvent<HTMLDivElement>) => {
    setanchorEl(event.currentTarget);
  };

  const goBack = () => {
    navigate("/lend");
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
    <section id="createlendsecret">
      <p className="title">
        Lend Secrets <br />
        <span>Let others use your secrets at a fee</span>
      </p>

      <div className="secretselector" onClick={openPopOver}>
        <div className="img_desc">
          <img
            src={
              selSecretType == "POE"
                ? poelogo
                : selSecretType == "OPENAI"
                ? openailogo
                : awxlogo
            }
            alt="secret"
          />

          <p className="desc">
            {selSecretType} <br />
            <span>
              {selSecretType == "POE"
                ? "L9P0..."
                : selSecretType == "OPENAI"
                ? "0K87..."
                : "76Yh..."}
            </span>
          </p>
        </div>

        <span className="inv_icon">
          <ChevronLeft width={6} height={11} color={colors.textsecondary} />
        </span>
      </div>
      <PopOver anchorEl={anchorEl} setAnchorEl={setanchorEl}>
        {
          <div className="select_secrets">
            <div
              className="img_desc"
              onClick={() => {
                setSelSecretType("POE");
                setanchorEl(null);
              }}
            >
              <img src={poelogo} alt="secret" />

              <p className="desc">
                POE <br /> <span>L9P0...</span>
              </p>
            </div>

            <div
              className="img_desc"
              onClick={() => {
                setSelSecretType("OPENAI");
                setanchorEl(null);
              }}
            >
              <img src={openailogo} alt="secret" />

              <p className="desc">
                OpenAi <br /> <span>0K87...</span>
              </p>
            </div>

            <div
              className="img_desc"
              onClick={() => {
                setSelSecretType("AIRWALLEX");
                setanchorEl(null);
              }}
            >
              <img src={awxlogo} alt="secret" />

              <p className="desc">
                Airwallex <br /> <span>76Yh...</span>
              </p>
            </div>

            <p className="asset_tle">
              Select the secret you would like to lend
            </p>
          </div>
        }
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
        <p className="ttle">
          Fee <br />
          <span>How much do you want to charge for the secret ?</span>
        </p>

        <div className="qfees">
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
          </span>{" "}
          to use the secret
        </p>
      </div>

      <button className="submit" onClick={goBack}>
        Lend Secret <Import width={16} height={16} color={colors.textprimary} />
      </button>
    </section>
  );
}
