import { JSX, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { backButton, retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { TextField } from "@mui/material";
import { useSnackbar } from "../../hooks/snackbar";
import { useTabs } from "../../hooks/tabs";
import { importKey } from "../../utils/api/keys";
import { colors } from "../../constants";
import { Loading } from "../../assets/animations";
import { Add } from "../../assets/icons/actions";
import secrets from "../../assets/images/secrets.png";
import openai from "../../assets/images/openai-alt.png";
import airwlx from "../../assets/images/awx.png";
import "../../styles/pages/impportsecret.scss";

export default function ImportSecret(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { switchtab } = useTabs();

  const [importedKey, setImportedKey] = useState<string>("");
  const [keyUtil, setkeyUtil] = useState<"OPENAI" | "AIRWALLEX">("AIRWALLEX");
  const [processing, setProcessing] = useState<boolean>(false);

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  const onImportKey = async () => {
    if (importedKey == "") {
      showerrorsnack("Enter the secret to import");
    } else {
      setProcessing(true);

      let token: string | null = localStorage.getItem("token");

      let { initData } = retrieveLaunchParams();

      const { isOk } = await importKey(
        token as string,
        importedKey.substring(0, 4),
        "own",
        importedKey,
        initData?.user?.username as string,
        keyUtil
      );

      if (isOk) {
        showsuccesssnack("Your key was imported successfully");
        goBack();
      } else {
        showerrorsnack("An unexpected error occurred");
      }
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(goBack);
    }

    return () => {
      backButton.offClick(goBack);
      backButton.unmount();
    };
  }, []);

  return (
    <div id="importkey">
      <img src={secrets} alt="import secret(s)" />

      <p className="title">Import your secret and store it securely</p>

      <TextField
        value={importedKey}
        onChange={(ev) => setImportedKey(ev.target.value)}
        label="Your Secret/Key"
        placeholder="Secret/key"
        fullWidth
        variant="outlined"
        autoComplete="off"
        type="text"
        sx={{
          marginTop: "1rem",
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

      <div className="keyutil">
        <p className="_secret_utils">What will this secret be used for ?</p>

        <div
          className="util"
          style={{ backgroundImage: `url(${airwlx})` }}
          onClick={() => setkeyUtil("AIRWALLEX")}
        >
          <div className="radioctr">
            <div
              style={{
                backgroundColor:
                  keyUtil == "AIRWALLEX" ? colors.textprimary : colors.primary,
              }}
            />
          </div>

          <p className="purpose">
            AirWallex
            <span>Access my AirWallex balances</span>
          </p>
        </div>

        <div
          className="util"
          style={{ backgroundImage: `url(${openai})` }}
          onClick={() => setkeyUtil("OPENAI")}
        >
          <div className="radioctr">
            <div
              style={{
                backgroundColor:
                  keyUtil == "OPENAI" ? colors.textprimary : colors.primary,
              }}
            />
          </div>

          <p className="purpose">
            AI Chatbot
            <span>Access GPT-4o powered chatbot</span>
          </p>
        </div>
      </div>

      <button disabled={importedKey == "" || processing} onClick={onImportKey}>
        {processing ? (
          <Loading width="1.5rem" height="1.5rem" />
        ) : (
          <>
            Import Secret
            <Add
              width={16}
              height={16}
              color={
                importedKey == "" || processing
                  ? colors.textsecondary
                  : colors.textprimary
              }
            />
          </>
        )}
      </button>
    </div>
  );
}
