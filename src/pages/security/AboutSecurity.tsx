import { JSX, useEffect } from "react";
import { useNavigate } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import distributed from "../../assets/images/icons/distributed.png";
import backup from "../../assets/images/icons/backup.png";
import hardware from "../../assets/images/icons/hardware.png";
import quantum from "../../assets/images/icons/quantumshield.png";
import { colors } from "../../constants";
import { Security } from "../../assets/icons/tabs";
import { Info } from "../../assets/icons/actions";
import "../../styles/pages/security/aboutsecurity.scss";

export default function AboutSecurity(): JSX.Element {
  const navigate = useNavigate();

  const goToSetup = () => {
    navigate("/security/setup");
  };

  const goBack = () => {
    navigate("/security/setup");
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
    <section id="aboutsecurity">
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
          Setup Your Nodes & TEE <Security color={colors.textprimary} />
        </button>

        <p className="desc desc_footer">
          Keys & Secrets are always reconstructed in a Trusted Execution
          Environment (TEE)
        </p>
      </div>
    </section>
  );
}
