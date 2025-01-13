import { JSX } from "react";
import { ComingSoon, Info, Lock, NFT, Security } from "../../../assets/icons";
import { colors } from "../../../constants";
import "../../../styles/components/tabs/security/tees.css";

export type teeType = {
  id: string;
  name: string;
  description: string;
  status: string;
  securityLevel: string;
  location: string;
  countryFlag: string;
  latency: string;
  users: string;
  specs: {
    encryption: string;
    certification: string;
    availability: string;
    maxOperations: string;
  };
};

interface props {
  selectedTee: teeType;
}

export const TEE = ({ selectedTee }: props): JSX.Element => {
  return (
    <div className="tee">
      <div className="status_country">
        <div className="status">
          <label>
            {selectedTee?.name}&nbsp;
            <em className="usercount">({selectedTee?.users} Users)</em>
          </label>
          <span>
            <Info width={12} height={12} color={colors?.textprimary} />
            {selectedTee?.status}
          </span>
        </div>

        <div className="country">
          <span className="flag">{selectedTee?.countryFlag}</span>
          <span className="name">{selectedTee?.location}</span>
        </div>
      </div>

      <p className="desc">{selectedTee?.description}</p>

      <div className="specs">
        <div>
          <Lock color={colors.textprimary} />
          <p>
            <span>Encryption</span> {selectedTee?.specs?.encryption}
          </p>
        </div>
        <div>
          <Security width={14} height={18} color={colors.textprimary} />
          <p>
            <span>Certification</span> {selectedTee?.specs?.certification}
          </p>
        </div>
        <div>
          <ComingSoon width={18} height={20} color={colors.textprimary} />
          <p>
            <span>Latency</span> {selectedTee?.latency}
          </p>
        </div>
        <div>
          <NFT color={colors.textprimary} />
          <p>
            <span>Operations</span> {selectedTee?.specs?.maxOperations}
          </p>
        </div>
      </div>
    </div>
  );
};
