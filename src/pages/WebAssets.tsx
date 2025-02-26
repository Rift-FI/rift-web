import { JSX, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { backButton } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { useTabs } from "../hooks/tabs";
import { fetchMyKeys, getkeysType, keyType } from "../utils/api/keys";
import { Secrets } from "../components/web2/Secrets";
import { ImportSecret } from "../components/web2/ImportSecret";
import "../styles/pages/webassets.scss";

export default function WebAssets(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const { data } = useQuery({
    queryKey: ["secrets"],
    queryFn: fetchMyKeys,
  });

  let allKeys = data as getkeysType;
  let mykeys: keyType[] = allKeys?.keys?.map((_key: string) =>
    JSON.parse(_key)
  );

  const goBack = () => {
    switchtab("home");
    navigate("/app");
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
    <section id="webassets">
      <Secrets mykeys={mykeys} />
      <ImportSecret />
    </section>
  );
}
