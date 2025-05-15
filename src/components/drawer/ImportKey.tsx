import { JSX, useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { importKey } from "../../utils/api/keys";
import { RadioButton } from "../global/Radios";
import { OutlinedTextInput } from "../global/Inputs";
import { PlusSolid } from "../../assets/icons";
import { Loading } from "../../assets/animations";
import { colors } from "../../constants";
import openailogo from "../../assets/images/logos/openai.png";
import "../../styles/components/drawer/importkey.scss";

export const ImportKey = (): JSX.Element => {
  const queryclient = useQueryClient();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  const [secretValue, setSecretValue] = useState<string>("");
  const [secretPurpose, setSecretPurpose] = useState<"OPENAI">("OPENAI");

  const { mutate: mutateImportKey, isPending: importkeypending } = useMutation({
    mutationFn: () =>
      importKey(secretValue, secretPurpose)
        .then((res) => {
          if (res?.isOk) {
            showsuccesssnack("Your API key was imported successfully");
            queryclient.invalidateQueries({ queryKey: ["secrets"] });
            closeAppDrawer();
          } else {
            showerrorsnack("An unexpected error occurred");
          }
        })
        .catch(() => {
          showerrorsnack("An unexpected error occurred");
        }),
  });

  const onImportKey = async () => {
    if (secretValue == "") {
      showerrorsnack("Enter a valid API key");
    } else {
      showsuccesssnack("Importing your key...");
      mutateImportKey();
    }
  };

  return (
    <div className="importkey">
      <p className="title">
        Import Key <span>Import your keys & earn by lending them</span>
      </p>

      <OutlinedTextInput
        inputType="text"
        inputState={secretValue}
        setInputState={setSecretValue}
        inputlabalel="Your OpenAI Key"
        placeholder="*** *** ***"
      />

      <p className="purpose">What will this key be used for ?</p>

      <div className="keys-purpose">
        <RadioButton
          image={openailogo}
          title="OpenAi"
          description="Access GPT-4o powered interface"
          ischecked
          onclick={() => setSecretPurpose("OPENAI")}
        />
      </div>

      <button onClick={onImportKey} className="submit-key">
        {importkeypending ? (
          <Loading width="1rem" height="1rem" />
        ) : (
          <>
            Import Key <PlusSolid color={colors.textprimary} />
          </>
        )}
      </button>
    </div>
  );
};
