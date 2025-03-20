import { JSX, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useBackButton } from "../hooks/backbutton";
import { useTabs } from "../hooks/tabs";
import { fetchMyKeys, keyType } from "../utils/api/keys";
import { Secrets } from "../components/web2/Secrets";
import { ImportSecret } from "../components/web2/ImportSecret";
import "../styles/pages/webassets.scss";

export default function WebAssets(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const [showImportModal, setShowImportModal] = useState(false);

  const { data: mykeys } = useQuery({
    queryKey: ["secrets"],
    queryFn: fetchMyKeys,
  });

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  useBackButton(goBack);

  return (
    <section id="webassets">
      <div className="header">
        <h1>Web2 Assets</h1>
        <button
          className="import-button"
          onClick={() => setShowImportModal(true)}
        >
          Import New Secret
        </button>
      </div>

      {mykeys?.length === 0 ? (
        <div className="empty-state">
          <p>No secrets imported yet</p>
          <button
            className="import-button-large"
            onClick={() => setShowImportModal(true)}
          >
            Import Your First Secret
          </button>
        </div>
      ) : (
        <Secrets
          mykeys={
            typeof mykeys == "object"
              ? ([] as keyType[])
              : (mykeys as unknown as keyType[])
          }
        />
      )}

      {showImportModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowImportModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <ImportSecret onClose={() => setShowImportModal(false)} />
          </div>
        </div>
      )}
    </section>
  );
}
