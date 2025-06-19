import { LoginResponse } from "@stratosphere-network/wallet";
import { createContext, ReactNode } from "react";

interface WalletContext {
  account: LoginResponse | null;
}

const walletContext = createContext<WalletContext>({
  account: null,
});

interface Props {
  children: ReactNode;
}
export default function WalletContextProvider(props: Props) {
  const { children } = props;

  return (
    <walletContext.Provider
      value={{
        account: null,
      }}
    >
      {children}
    </walletContext.Provider>
  );
}
