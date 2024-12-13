import { JSX } from "react";
import { Switch } from "@mui/material";
import {
  SecurityOutlined,
  StorageOutlined,
  InfoOutlined,
  SmartphoneOutlined,
} from "@mui/icons-material";
import { Database, Import } from "../../assets/icons";
import { colors } from "../../constants";
import "../../styles/components/tabs/security.css";

export const SecurityTab = (): JSX.Element => {
  return (
    <section id="securitytab">
      <p className="tab_title">Security Settings</p>
      <div className="divider" />

      <span className="icon">
        <SecurityOutlined /> Key Storage
      </span>
      <span className="ic_desc">
        Configure how your private key is stored and protected
      </span>

      <p className="ic_desc_0">
        Your private key is split and stored across multiple servers. Select at
        least 4 servers for enhanced security.
      </p>

      <div className="keysplits">
        <KeySplit title="PKMT Official" auditted uptime={99.99} />
        <KeySplit title="PKMT Official 2" auditted uptime={99.99} />
        <KeySplit title="BCW Technologies" auditted />
        <KeySplit title="Qupital" uptime={99.99} />
        <KeySplit title="Hex Technologies" auditted />
        <KeySplit title="IDA" uptime={99.99} />
        <KeySplit title="ZA Bank" />
      </div>

      <div className="divider" />

      <div className="eex_ctr">
        <p className="eex">
          <StorageOutlined />
          Execution Environment
        </p>
        <span>Choose your trusted execution environment</span>
      </div>

      <p className="sel_tee">
        Choose your preferred Trusted Execution Environment (TEE)
      </p>

      <form className="tee_radio">
        <div>
          <input type="radio" name="sys" id="sys" />
          <label>PKMT Official TEE</label>
        </div>

        <div>
          <input type="radio" name="sys" id="sys" />
          <label>System Random</label>
        </div>

        <div>
          <input type="radio" name="sys" id="sys" />
          <label>BCW Technologie TEE</label>
        </div>

        <div>
          <input type="radio" name="sys" id="sys" />
          <label>Qupital TEE</label>
        </div>

        <div>
          <input type="radio" name="sys" id="sys" />
          <label>Custom HSM</label>
        </div>
      </form>

      <div className="divider" />

      <div className="key_mgmt">
        <span className="title">
          <Import />
          Key Management
        </span>
        <p className="desc">Advanced key splitting and backup options</p>

        <p className="info">
          <InfoOutlined color="error" />
          Advanced key splitting and backup options are available with a premium
          subscription.
        </p>

        <button className="upgrade">Upgrade to premium</button>
      </div>

      <div className="divider" />

      <div className="twofa">
        <span className="title">
          <SmartphoneOutlined />
          Two-Factor Authentication
        </span>
        <p className="desc">Add an extra layer of security to your account</p>

        <div className="switch">
          <Switch /> <span>Enable Two Factor Authentication</span>
        </div>

        <p className="desc">
          Add an extra layer of security to your account by requiring a second
          form of authentication.
        </p>
      </div>
    </section>
  );
};

const KeySplit = ({
  title,
  auditted,
  uptime,
}: {
  title: string;
  auditted?: boolean;
  uptime?: number;
}): JSX.Element => {
  return (
    <div className="key">
      <div>
        <span className="key_title">
          <Database color={colors.danger} /> &nbsp;
          {title}
        </span>

        {auditted && <span className="security">Security Auditted</span>}
        {uptime && <span className="uptime">{uptime}% Uptime</span>}
      </div>

      <Switch />
    </div>
  );
};
