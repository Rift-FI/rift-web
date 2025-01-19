import { JSX, useEffect } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { useTabs } from "../../hooks/tabs";
import { colors } from "../../constants";
import { ChevronLeft, Lock, Node, TEE } from "../../assets/icons";
import { TEE as TEEComponent } from "../../components/tabs/security/TEEs";
import { Nodes } from "../../components/tabs/security/Nodes";
import nodestees from "../../components/tabs/security/nodestees.json";
import "../../styles/pages/securitysetup.css";

export default function SecuritySetup(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const goBack = () => {
    switchtab("security");
    navigate(-1);
  };

  const goToNodes = () => {
    navigate("/security/selector/nodes");
  };

  const goToTees = () => {
    navigate("/security/selector/tees");
  };

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(goBack);
    }

    return () => {
      backButton.offClick(goBack);
      backButton.unmount();
    };
  }, []);

  return (
    <section id="securitysetup">
      <p className="title">
        Set Up Your Security
        <span>Choose Nodes and a TEE for your keys</span>
      </p>

      <div className="title_nodes_tee">
        <span className="icon">
          <Node width={16} height={16} color={colors.accent} />
        </span>

        <p>
          Nodes
          <br />
          <span>You can select upto four nodes</span>
        </p>
      </div>

      <div className="selectednodes">
        {nodestees.NODES.slice(0, 4).map((_node) => (
          <Nodes key={_node?.id} selectedNode={_node} />
        ))}
      </div>

      <button className="seeall" onClick={goToNodes}>
        More Nodes
        <span>
          <ChevronLeft width={6} height={12} color={colors.textsecondary} />
        </span>
      </button>

      <div className="title_nodes_tee teees">
        <span className="icon">
          <TEE width={16} height={18} color={colors.success} />
        </span>

        <p>
          TEEs
          <br />
          <span>Select a Trsuted Execution Environment</span>
        </p>
      </div>

      <TEEComponent selectedTee={nodestees.TEES[1]} />

      <button className="seeall" onClick={goToTees}>
        More TEEs
        <span>
          <ChevronLeft width={6} height={12} color={colors.textsecondary} />
        </span>
      </button>

      <div className="two-fa" onClick={goToTees}>
        <span className="icon">
          <Lock width={16} height={20} color={colors.textprimary} />
        </span>

        <p>
          Two Factor Authentication
          <span>
            Enhance your security by setting up two-factor authentication (2fa)
          </span>
        </p>
      </div>
    </section>
  );
}
