import { JSX, useState } from "react";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useMutation } from "@tanstack/react-query";
import { useSnackbar } from "@/hooks/snackbar";
import { useTabs } from "@/hooks/tabs";
import { useAppDrawer } from "@/hooks/drawer";
import { registerWithKey } from "@/utils/polymarket/auth";
import { OutlinedTextInput } from "../global/Inputs";
import { SubmitButton } from "../global/Buttons";
import "@/styles/pages/polymarket/polymarketauth.scss";

export const PolymarketAuth = (): JSX.Element => {
  const { initData } = useLaunchParams();
  const { showerrorsnack, showsuccesssnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();
  const { switchtab } = useTabs();

  const [privatekey, setPrivateKey] = useState<string>("");

  const tgUserId: string = String(initData?.user?.id as number);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      registerWithKey(privatekey, tgUserId)
        .then((res) => {
          if (res?.token) {
            localStorage.setItem("polymarkettoken", res?.token);
            showsuccesssnack("Your key was imported successfully");
            switchtab("polymarket");
            closeAppDrawer();
          } else {
            showerrorsnack("An unexpetced error occurred, please try again");
          }
        })
        .catch(() => {
          showerrorsnack("An unexpetced error occurred, please try again");
        }),
  });

  return (
    <div className="polymarketauth">
      <p className="title">
        To get started with trading on Polymarket, please start by importing
        your MetaMask Private key
      </p>

      <OutlinedTextInput
        inputState={privatekey}
        setInputState={setPrivateKey}
        inputType="text"
        inputlabalel="Your Private Key"
        placeholder="private key"
      />

      <SubmitButton
        text="Import Your Key"
        sxstyles={{
          marginTop: "1rem",
          padding: "0.5rem",
          borderRadius: "0.5rem",
          fontWeight: "600",
        }}
        isDisabled={privatekey == "" || isPending}
        isLoading={isPending}
        onclick={() => mutate()}
      />

      <p className="desc">
        Your private key lets you fund your trades on polymarket
      </p>
    </div>
  );
};
