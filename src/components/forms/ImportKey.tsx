import { JSX, useState } from "react";
import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { TextField } from "@mui/material";
import { useSnackbar } from "../../hooks/snackbar";
import { importKey } from "../../utils/api/keys";
import { Add } from "../../assets/icons";
import { Loading } from "../../assets/animations";
import { colors } from "../../constants";
import secrets from "../../assets/images/secrets.png";
import "../../styles/components/forms.css";

export const ImportKey = (): JSX.Element => {
  const { showsuccesssnack, showerrorsnack } = useSnackbar();

  const [importedKey, setImportedKey] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);

  const onImportKey = async () => {
    setProcessing(true);
    let token: string | null = localStorage.getItem("token");
    let { initData } = retrieveLaunchParams();
    const { isOk } = await importKey(
      token as string,
      importedKey.substring(0, 4),
      "own",
      importedKey,
      initData?.user?.username as string
    );

    if (isOk) {
      setProcessing(false);
      showsuccesssnack("Key was imported successfully");
    } else {
      setProcessing(false);
      showerrorsnack("An unexpected error occurred");
    }
  };

  return (
    <div id="importkey">
      <img src={secrets} alt="import secret(s)" />

      <p>Paste your secret (private) key from which a wallet will be created</p>

      <TextField
        value={importedKey}
        onChange={(ev) => setImportedKey(ev.target.value)}
        label="Your Key"
        fullWidth
        variant="outlined"
        autoComplete="off"
        multiline
        maxRows={6}
        sx={{
          marginTop: "1.5rem",
          "& .MuiInputBase-input": {
            color: colors.textprimary,
          },
          "& .MuiInputLabel-root": {
            color: colors.textsecondary,
          },
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: colors.divider,
            },
            "&:hover fieldset": {
              borderColor: colors.divider,
            },
            "&.Mui-focused fieldset": {
              borderColor: colors.accent,
            },
          },
        }}
      />

      <button onClick={onImportKey}>
        {processing ? (
          <Loading width="1.5rem" height="1.5rem" />
        ) : (
          <>
            Import Key <Add width={20} height={20} color={colors.primary} />
          </>
        )}
      </button>
    </div>
  );
};
