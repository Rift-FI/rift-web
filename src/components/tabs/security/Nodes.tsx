import { CSSProperties, JSX } from "react";
import { PrivateNode, PublicNode } from "../../../assets/icons/security";
import { colors } from "../../../constants";
import "../../../styles/components/tabs/security/node.scss";

export type nodeType = {
  id: string;
  name: string;
  features: {
    security: string;
    reliability: string;
    redundancy: string;
    real_life_recovery: string;
  };
  cost: string;
  location: string;
  countryFlag: string;
  isPrivate: boolean;
  status: string;
};

interface props {
  selectedNode: nodeType;
  aumvalue?: number;
  sxstyles?: CSSProperties;
}

export const Nodes = ({ selectedNode }: props): JSX.Element => {
  return (
    <div className="nodee">
      <p className="name_location">
        {selectedNode?.name}
        <span className="text-xs text-gray-400">{selectedNode?.location}</span>
      </p>

      <div className="private_public">
        <label className="cost">
          {selectedNode?.isPrivate ? "Private Node" : ""}
        </label>

        <span>
          {selectedNode?.isPrivate ? (
            <PrivateNode width={14} height={16} color={colors.textprimary} />
          ) : (
            <PublicNode color={colors.textprimary} />
          )}
        </span>
      </div>
    </div>
  );
};

export const AltNodes = ({
  selectedNode,
  aumvalue,
  sxstyles,
}: props): JSX.Element => {
  return (
    <div className="nodee altnodee" style={sxstyles}>
      <p className="name_location">
        {selectedNode?.name}
        <span className="text-gray-400 text-xs">{selectedNode?.location}</span>
      </p>

      <div className="flex flex-col gap-1">
        <p className="aum">
          AUM: <span>${aumvalue}M</span>
        </p>

        <span className="holds">Holds 1 shard</span>
      </div>
    </div>
  );
};
