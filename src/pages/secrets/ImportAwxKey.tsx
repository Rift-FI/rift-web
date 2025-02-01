import { JSX, useEffect, useState } from "react";
import { backButton, useLaunchParams } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { TextField } from "@mui/material";
import { useTabs } from "../../hooks/tabs";
import { useSnackbar } from "../../hooks/snackbar";
import { importAwxKey } from "../../utils/api/awllx";
import { colors } from "../../constants";
import { Import } from "../../assets/icons";
import { Loading } from "../../assets/animations";
import airwlx from "../../assets/images/secrets.png";
import "../../styles/components/secrets/airwallex.scss";

export default function ImportAirwllxKey(): JSX.Element {
  const { initData } = useLaunchParams();
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();

  const [importKey, setImportKey] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);

  const goBack = () => {
    switchtab("profile");
    navigate(-1);
  };

  const onImportKey = async () => {
    if (importKey == "") {
      showerrorsnack("Enter a valid AirWallex API key");
    } else {
      setProcessing(true);
      let token: string | null = localStorage.getItem("token");
      let keyOwner = initData?.user?.username;

      const { isOk } = await importAwxKey(
        token as string,
        importKey,
        keyOwner as string
      );

      if (isOk) {
        localStorage.setItem("userhasawxkey", "true");
        showsuccesssnack("Key was imported successfully");
        goBack();
      } else {
        showerrorsnack("An error occurred, please try again");
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
    <div id="importawxkey">
      <img src={airwlx} alt="import secret(s)" />

      <div className="about">
        <p className="title">Import your AirWallex API Key</p>
        <p className="desc">Buy OM using your AirWallex balances</p>
      </div>

      <TextField
        value={importKey}
        onChange={(ev) => setImportKey(ev.target.value)}
        label="Your API Key"
        placeholder="Your AirWallex API key"
        fullWidth
        variant="outlined"
        autoComplete="off"
        sx={{
          marginTop: "1.5rem",
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

      <button disabled={importKey == ""} onClick={onImportKey}>
        {processing ? (
          <Loading width="1.5rem" height="1.5rem" />
        ) : (
          <>
            Import Key
            <Import
              width={16}
              height={16}
              color={
                importKey == "" ? colors.textsecondary : colors.textprimary
              }
            />
          </>
        )}
      </button>
    </div>
  );
}
