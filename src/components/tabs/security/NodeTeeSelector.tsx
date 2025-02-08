import { JSX } from "react";
import { useSnackbar } from "../../../hooks/snackbar";
import { useAppDrawer } from "../../../hooks/drawer";
import { nodeType } from "./Nodes";
import { teeType } from "./TEEs";
import { PrivateNode, PublicNode } from "../../../assets/icons/security";
import { ComingSoon, Info, Lock, NFT } from "../../../assets/icons/actions";
import { Security } from "../../../assets/icons/tabs";
import { colors } from "../../../constants";
import "../../../styles/components/tabs/security/nodeteeselect.scss";

export const NodeTeeSelector = (): JSX.Element => {
  const { closeAppDrawer } = useAppDrawer();
  const { showsuccesssnack } = useSnackbar();

  const electing = localStorage.getItem("electing");
  const selectednode: nodeType = JSON.parse(
    localStorage.getItem("selectednode") as string
  );
  const selectedtee: teeType = JSON.parse(
    localStorage.getItem("selectedtee") as string
  );
  const disableElect = localStorage.getItem("disableElect");

  const onElectNodeTee = () => {
    showsuccesssnack("Changes applied...");

    closeAppDrawer();
  };

  return (
    <div className="nodeteeselector">
      {electing == "nodes" ? (
        <>
          <div className="electnode_l1">
            <p className="title_loc">
              {selectednode?.name}
              <br />
              <span>
                {selectednode.location} {selectednode?.countryFlag}
              </span>
            </p>

            <span className="icon">
              {selectednode?.isPrivate ? (
                <PrivateNode width={14} height={16} color={colors.primary} />
              ) : (
                <PublicNode color={colors.primary} />
              )}
            </span>
          </div>

          <div className="electnode_l2">
            <p>
              <span>Security</span>
              {selectednode?.features.security}
            </p>
            <p>
              <span>Recovery</span>
              {selectednode?.features.real_life_recovery}
            </p>
            <p>
              <span>Redundancy</span>
              {selectednode?.features.redundancy}
            </p>
            <p>
              <span>Reliability</span>
              {selectednode?.features.reliability}
            </p>
          </div>

          <div className="electnode_l3">
            <p>
              <span>Cost</span>
              {selectednode.isPrivate
                ? "This private node includes a monthly fee ($5)"
                : "This node does not include a cost"}
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="electtee">
            <div className="status_country">
              <div className="status">
                <label>
                  {selectedtee?.name}&nbsp;
                  <em className="usercount">({selectedtee?.users} Users)</em>
                </label>
                <span>
                  <Info width={12} height={12} color={colors?.textprimary} />
                  {selectedtee?.status}
                </span>
              </div>

              <div className="country">
                <span className="flag">{selectedtee?.countryFlag}</span>
                <span className="name">{selectedtee?.location}</span>
              </div>
            </div>

            <p className="desc">{selectedtee?.description}</p>

            <div className="specs">
              <div>
                <Lock color={colors.textprimary} />
                <p>
                  <span>Encryption</span> {selectedtee?.specs?.encryption}
                </p>
              </div>
              <div>
                <Security width={14} height={18} color={colors.textprimary} />
                <p>
                  <span>Certification</span> {selectedtee?.specs?.certification}
                </p>
              </div>
              <div>
                <ComingSoon width={18} height={20} color={colors.textprimary} />
                <p>
                  <span>Latency</span> {selectedtee?.latency}
                </p>
              </div>
              <div>
                <NFT color={colors.textprimary} />
                <p>
                  <span>Operations</span> {selectedtee?.specs?.maxOperations}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <button
        disabled={disableElect == "mytee" || disableElect == "mynodes"}
        onClick={onElectNodeTee}
      >
        Select {electing == "nodes" ? "Node" : "TEE"}
      </button>
    </div>
  );
};
