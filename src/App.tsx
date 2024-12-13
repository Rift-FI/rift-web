import { JSX, Fragment, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useTabs } from "./hooks/tabs";
import { SnackBar } from "./components/global/SnackBar";
import { BottomTabNavigation } from "./components/Bottom";
import { VaultTab } from "./components/tabs/Vault";
import { SecurityTab } from "./components/tabs/Security";
import "./styles/app.css";

function App(): JSX.Element {
  const { currTab } = useTabs();
  const navigate = useNavigate();

  const checkAccessUser = useCallback(() => {
    let address: string | null = localStorage.getItem("address");
    let token: string | null = localStorage.getItem("token");

    if (address == "" || address == null || token == "" || token == null)
      navigate("/signup");
  }, []);

  useEffect(() => {
    checkAccessUser();
  }, []);

  return (
    <section>
      {currTab == "vault" ? (
        <Fragment>
          <VaultTab />
        </Fragment>
      ) : currTab == "security" ? (
        <Fragment>
          <SecurityTab />
        </Fragment>
      ) : (
        <Fragment>
          <div id="appctr">
            <p>Coming soon!</p>
          </div>
        </Fragment>
      )}

      <SnackBar />
      <BottomTabNavigation />
    </section>
  );
}

export default App;
