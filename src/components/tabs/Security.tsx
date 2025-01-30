import { JSX, useEffect } from "react";
import { useNavigate } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { useTabs } from "../../hooks/tabs";
import distributed from "../../assets/images/icons/distributed.png";
import backup from "../../assets/images/icons/backup.png";
import hardware from "../../assets/images/icons/hardware.png";
import quantum from "../../assets/images/icons/quantumshield.png";
import { colors } from "../../constants";
import { Info, Security } from "../../assets/icons";
import "../../styles/components/tabs/security.scss";

export const SecurityTab = (): JSX.Element => {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const goToSetup = () => {
    navigate("/security/setup");
  };

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(() => switchtab("home"));
    }

    return () => {
      backButton.offClick(() => switchtab("home"));
      backButton.unmount();
    };
  }, []);

  return (
    <section id="securitytab">
      <div className="aboutsec">
        <p className="title">
          Secutiry
          <br />
        </p>
        <p className="desc">
          We enhance the security of your keys by splitting, encrypting and
          storing them across multiple servers.
        </p>
        <p className="descmsg">
          <Info width={14} height={14} color={colors.textprimary} /> This
          architecture ensures
        </p>

        <div className="get">
          <img src={distributed} alt="backup" />

          <p>
            Distributed Redundancy <br />
            <span>
              Storing keys across multiple nodes ensures they are recoverable
              even if one node fails
            </span>
          </p>
        </div>
        <div className="get">
          <img src={backup} alt="backup" />

          <p>
            Backup & Recovery <br />
            <span>
              Specialized nodes offer built-in backup and recovery services
            </span>
          </p>
        </div>
        <div className="get">
          <img src={hardware} alt="backup" />

          <p>
            Hardware-Level Security <br />
            <span>
              TEEs offer isolated execution environments protected from
              unauthorized access
            </span>
          </p>
        </div>
        <div className="get">
          <img src={quantum} alt="backup" />

          <p>
            Quantum-Resistant Execution <br />
            <span>
              Advanced TEEs utilise quantum-resistant protocols to protect
              against future threats
            </span>
          </p>
        </div>

        <button className="setup" onClick={goToSetup}>
          Setup Your Security <Security color={colors.textprimary} />{" "}
        </button>

        <p className="desc desc_footer">
          Keys are always reconstructed in a Trusted Execution Environment ( TEE
          )
        </p>
      </div>
    </section>
  );
};

// const nodeLocations: locationType[] = [
//   { id: 1, latitude: 22.396427, longitude: 114.109497, nodeDisabled: false }, // hong kong
//   { id: 2, latitude: 1.352083, longitude: 103.819839, nodeDisabled: true }, // singapore
//   { id: 3, latitude: 23.697809, longitude: 120.960518, nodeDisabled: true }, // taiwan
//   { id: 4, latitude: 35.689487, longitude: 139.691711, nodeDisabled: true }, // tokyo
// ];
