import { JSX, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { useAppDrawer } from "../../hooks/drawer";
import { useAppDialog } from "../../hooks/dialog";
import { useSnackbar } from "../../hooks/snackbar";
import {
  fetchMyKeys,
  getMyLendKeys,
  keyType,
  UseOpenAiKey,
} from "../../utils/api/keys";
import { stringToBase64 } from "../../utils/base64";
import {
  ArrowRightUp,
  Clipboard,
  Trash,
  Lock,
  PlusSolid,
} from "../../assets/icons";
import { colors } from "../../constants";
import openailogo from "../../assets/images/logos/openai.png";
import "../../styles/components/tabs/keystab.scss";

export const KeysTab = (): JSX.Element => {
  const { switchtab } = useTabs();
  const { openAppDrawer } = useAppDrawer();

  const [keysFilter, setKeysFiletr] = useState<
    "all" | "mykeys" | "borrowed" | "lent"
  >("all");

  const goBack = () => {
    switchtab("home");
  };

  const { data: allkeys } = useQuery({
    queryKey: ["secrets"],
    queryFn: fetchMyKeys,
  });
  const { data: mylentkeys } = useQuery({
    queryKey: ["mylentkeys"],
    queryFn: getMyLendKeys,
  });

  const mykeys = allkeys?.filter((_key) => _key?.nonce == null);
  const borrowedkeys = allkeys?.filter((_key) => _key?.nonce !== null);

  const onImportKey = () => {
    openAppDrawer("importkey");
  };

  useBackButton(goBack);

  return (
    <div id="keystab">
      <p className="tab-title">
        Keys <span>Import your API keys & earn by lending them</span>
      </p>

      <div className="key-filters">
        <button
          onClick={() => setKeysFiletr("all")}
          className={keysFilter == "all" ? "active" : ""}
        >
          All (
          {Number(mykeys?.length || 0) +
            Number(borrowedkeys?.length || 0) +
            Number(mylentkeys?.length || 0)}
          )
        </button>

        <button
          onClick={() => setKeysFiletr("mykeys")}
          className={keysFilter == "mykeys" ? "active" : ""}
        >
          My Keys ({mykeys?.length || 0})
        </button>

        <button
          onClick={() => setKeysFiletr("borrowed")}
          className={keysFilter == "borrowed" ? "active" : ""}
        >
          Borrowed ({borrowedkeys?.length || 0})
        </button>

        <button
          onClick={() => setKeysFiletr("lent")}
          className={keysFilter == "lent" ? "active" : ""}
        >
          Lent ({mylentkeys?.length || 0})
        </button>
      </div>

      <div className="keys-ctr">
        {keysFilter == "all" && (
          <>
            {mykeys?.map((_key, idx) => (
              <MyKeyComponent keyprop={_key} key={_key?.id + idx} />
            ))}

            {borrowedkeys?.map((_key, idx) => (
              <BorrowedKeyComponent keyprop={_key} key={_key?.id + idx} />
            ))}

            {mylentkeys?.map((_key, idx) => (
              <LentKeyComponent keyprop={_key} key={_key?.id + idx} />
            ))}
          </>
        )}

        {keysFilter == "mykeys" &&
          mykeys?.map((_key, idx) => (
            <MyKeyComponent keyprop={_key} key={_key?.id + idx} />
          ))}

        {keysFilter == "borrowed" &&
          borrowedkeys?.map((_key, idx) => (
            <BorrowedKeyComponent keyprop={_key} key={_key?.id + idx} />
          ))}

        {keysFilter == "lent" &&
          mylentkeys?.map((_key, idx) => (
            <LentKeyComponent keyprop={_key} key={_key?.id + idx} />
          ))}
      </div>

      <button className="importkey" onClick={onImportKey}>
        <PlusSolid width={24} height={24} color={colors.textprimary} />
      </button>
    </div>
  );
};

const MyKeyComponent = ({ keyprop }: { keyprop: keyType }): JSX.Element => {
  const navigate = useNavigate();

  const onUseSecret = (
    _secretid: string,
    _secretnonce: string,
    secretvalue: string
  ) => {
    navigate(`/chatbot/${secretvalue}`);
  };

  const onLendSecret = (purpose: string, secretvalue: string) => {
    navigate(`/lend/secret/${purpose}/${secretvalue}`);
  };

  return (
    <div className="keycomponent">
      <div className="key-logo">
        <span className="img">
          <img src={openailogo} alt="open-ai" />
        </span>

        <p className="key-name">
          {keyprop?.value?.substring(0, 3)}***
          <span>{keyprop?.purpose}</span>
        </p>
      </div>

      <div className="key-actions">
        <button
          onClick={() =>
            onUseSecret(keyprop?.id, keyprop?.nonce as string, keyprop?.value)
          }
        >
          Use <ArrowRightUp color={colors.textprimary} />
        </button>

        <button onClick={() => onLendSecret(keyprop?.purpose, keyprop?.value)}>
          Lend <Clipboard color={colors.textprimary} />
        </button>
      </div>
    </div>
  );
};

const BorrowedKeyComponent = ({
  keyprop,
}: {
  keyprop: keyType;
}): JSX.Element => {
  const navigate = useNavigate();
  const { openAppDialog, closeAppDialog } = useAppDialog();
  const { showerrorsnack } = useSnackbar();

  const decodeOpenAiKey = async (scrtId: string, scrtNonce: string) => {
    openAppDialog("loading", "Preparing your chat...");

    const { response, accessToken, conversationId } = await UseOpenAiKey(
      scrtId as string,
      scrtNonce as string
    );

    if (response && accessToken && conversationId) {
      closeAppDialog();

      navigate(`/chat/${conversationId}/${accessToken}/${scrtNonce}`);
    } else {
      showerrorsnack("Sorry, access to the key may have expired");
      closeAppDialog();
    }
  };

  const onGetSecret = (paysecretnonce: string) => {
    localStorage.setItem("paysecretnonce", paysecretnonce);
    localStorage.setItem("prev_page", "keys");

    navigate("/claimlendkey");
  };

  const onUseSecret = (email: string, nonce: string) => {
    decodeOpenAiKey(stringToBase64(email), nonce as string);
  };

  return (
    <div className="keycomponent">
      <div className="key-logo">
        <span className="img">
          <img src={openailogo} alt="open-ai" />
        </span>

        <p className="key-name">
          {keyprop?.value?.substring(0, 3)}***
          <span>{keyprop?.purpose}</span>
        </p>
      </div>

      <div className="key-actions">
        <button
          onClick={() =>
            keyprop?.locked
              ? onGetSecret(keyprop?.nonce as string)
              : onUseSecret(keyprop?.email, keyprop?.nonce as string)
          }
        >
          {keyprop?.locked ? (
            <>
              Get Key <Lock width={14} height={14} color={colors.textprimary} />
            </>
          ) : (
            <>
              Use <ArrowRightUp color={colors.textprimary} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const LentKeyComponent = ({ keyprop }: { keyprop: keyType }): JSX.Element => {
  const { openAppDrawerWithKey } = useAppDrawer();

  const onRevokeKey = () => {
    openAppDrawerWithKey(
      "revokesecretaccess",
      keyprop?.nonce as string,
      keyprop?.purpose
    );
  };

  return (
    <div className="keycomponent">
      <div className="key-logo">
        <span className="img">
          <img src={openailogo} alt="open-ai" />
        </span>

        <p className="key-name">
          {keyprop?.value?.substring(0, 3)}***
          <span>{keyprop?.purpose}</span>
        </p>
      </div>

      <div className="key-actions" onClick={onRevokeKey}>
        <button className="revoke">
          Revoke Access <Trash width={16} height={18} color={colors.danger} />
        </button>
      </div>
    </div>
  );
};
