import { JSX, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { useSnackbar } from "../../hooks/snackbar";
import { importKey } from "../../utils/api/keys";
import { OutlinedTextInput } from "../global/Inputs";
import { SubmitButton } from "../global/Buttons";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import secrets from "../../assets/images/secrets.png";
import openai from "../../assets/images/openai-alt.png";
import airwlx from "../../assets/images/awx.png";
import "../../styles/components/web2/impportsecret.scss";

export const ImportSecret = (): JSX.Element => {
  const queryclient = useQueryClient();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();

  const [importedKey, setImportedKey] = useState<string>("");
  const [keyUtil, setkeyUtil] = useState<"OPENAI" | "AIRWALLEX">("AIRWALLEX");
  const [processing, setProcessing] = useState<boolean>(false);

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
        queryclient.invalidateQueries({ queryKey: ["secrets"] });
      } else {
        showerrorsnack("An unexpected error occurred");
      }
      setProcessing(false);
    }
  };

  return (
    <div id="importkey">
      <img src={secrets} alt="import secret(s)" />

      <p className="title">Import your Web2 secrets and Keys</p>

      <OutlinedTextInput
        inputType="text"
        placeholder="Secret/Key"
        inputlabalel="Your Web2 Secret/Key"
        inputState={importedKey}
        setInputState={setImportedKey}
        sxstyles={{ marginTop: "0.25rem" }}
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
            Banking
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
            AI
            <span>Access GPT-4o powered chatbot</span>
          </p>
        </div>
      </div>

      <SubmitButton
        text="Import Secret"
        icon={
          <FaIcon
            faIcon={faCirclePlus}
            color={
              importedKey == "" || processing
                ? colors.textsecondary
                : colors.textprimary
            }
          />
        }
        isDisabled={importedKey == "" || processing}
        isLoading={processing}
        onclick={onImportKey}
      />
    </div>
  );
};
