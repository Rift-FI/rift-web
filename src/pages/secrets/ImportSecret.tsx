import { JSX, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { backButton, retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { FormControlLabel, Radio, RadioGroup, TextField } from "@mui/material";
import { useSnackbar } from "../../hooks/snackbar";
import { useTabs } from "../../hooks/tabs";
import { importKey } from "../../utils/api/keys";
import { colors } from "../../constants";
import { Loading } from "../../assets/animations";
import { Add } from "../../assets/icons";
import secrets from "../../assets/images/secrets.png";
import "../../styles/pages/impportsecret.css";

export default function ImportSecret(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { switchtab } = useTabs();

  const [importedKey, setImportedKey] = useState<string>("");
  const [keyUtil, setkeyUtil] = useState<"OPENAI" | "AIRWALLEX">("AIRWALLEX");
  const [processing, setProcessing] = useState<boolean>(false);

  const goBack = () => {
    navigate(-1);
  };

  const goToSecurity = () => {
    switchtab("security");
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
        showsuccesssnack("Key imported successfully");
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
        variant="standard"
        autoComplete="off"
        multiline
        maxRows={6}
        sx={{
          marginTop: "1.25rem",
          "& .MuiInputBase-input": {
            color: colors.textprimary,
          },
          "& .MuiInputLabel-root": {
            color: colors.textsecondary,
          },
          "& .MuiInput-underline:before": {
            borderBottomColor: colors.textsecondary,
          },
          "& .MuiInput-underline:hover:before": {
            borderBottomColor: colors.textsecondary,
          },
          "& .MuiInput-underline:after": {
            borderBottomColor: colors.accent,
          },
        }}
      />

      <div className="keyutil">
        <p>What will this secret be used for ?</p>

        <RadioGroup
          aria-labelledby="demo-radio-buttons-group-label"
          defaultValue="AIRWALLEX"
          name="radio-buttons-group"
        >
          <FormControlLabel
            value="AIRWALLEX"
            onChange={() => setkeyUtil("AIRWALLEX")}
            control={
              <Radio
                sx={{
                  color: colors.textsecondary,
                  "&.Mui-checked": {
                    color: colors.danger,
                  },
                }}
              />
            }
            label="AirWallex"
            slotProps={{ typography: { fontSize: "0.875rem" } }}
            sx={{ color: "white" }}
          />
          <FormControlLabel
            value="OPENAI"
            onChange={() => setkeyUtil("OPENAI")}
            control={
              <Radio
                sx={{
                  color: colors.textsecondary,
                  "&.Mui-checked": {
                    color: colors.danger,
                  },
                }}
              />
            }
            label="AI ChatBot"
            slotProps={{ typography: { fontSize: "0.875rem" } }}
            sx={{ color: "white" }}
          />
        </RadioGroup>
      </div>

      <button disabled={processing} onClick={onImportKey}>
        {processing ? (
          <Loading width="1.5rem" height="1.5rem" />
        ) : (
          <>
            Import Secret
            <Add width={20} height={20} color={colors.textprimary} />
          </>
        )}
      </button>

      <p onClick={goToSecurity} className="learnmore">
        Learn how we secure your secrets
      </p>
    </div>
  );
}
