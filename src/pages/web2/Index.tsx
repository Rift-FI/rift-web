import { JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import Web2Assets from "../../components/web2/Index";
import ImportSecret from "../secrets/ImportSecret";
import { fetchMyKeys, getkeysType, keyType } from "../../utils/api/keys";
import "../../styles/components/tabs/home.scss";

export default function Web2Tab(): JSX.Element {
  const { data } = useQuery({
    queryKey: ["secrets"],
    queryFn: fetchMyKeys,
  });

  let allKeys = data as getkeysType;
  let mykeys: keyType[] = allKeys?.keys?.map((_key: string) =>
    JSON.parse(_key)
  );
  return (
    <>
      <ImportSecret />
      <Web2Assets mykeys={mykeys} />
    </>
  );
}
