import { CSSProperties, JSX } from "react";
import { useNavigate } from "react-router";

import { keyType } from "../utils/api/keys";
import { User } from "../assets/icons/actions";
import { colors } from "../constants";
import poelogo from "../assets/images/icons/poe.png";
import awxlogo from "../assets/images/awx.png";

import "../styles/components/secrets.scss";

export type secrettype = {
  secretVal: string;
};

export type sharedsecrettype = {
  secretVal: string;
  sharedfrom: string;
};

export const MySecrets = ({
  secretsLs,
}: {
  secretsLs: keyType[];
}): JSX.Element => {
  const navigate = useNavigate();

  let mysecrets = secretsLs.filter((_scret) => _scret.type == "own");

  return (
    <>
      <div id="mysecrets">
        {/* <div
          className="_secret"
          onClick={() =>
            openAppDrawerWithKey("secretactions", sphereId, "SPHERE")
          }
        >
          <span>Sphere Id</span>

          <img src={stratosphere} alt="secret-purpose" />
        </div> */}
        {mysecrets.map((secret, idx) => (
          <div
            className="_secret"
            key={secret?.name + idx}
            // onClick={() =>
            //   openAppDrawerWithKey(
            //     "secretactions",
            //     secret?.value,
            //     secret?.purpose
            //   )
            // }
          >
            <div className="secret-info">
              <img
                src={secret?.purpose == "OPENAI" ? poelogo : awxlogo}
                alt="secret-purpose"
                className="secret-logo"
              />

              <div className="secret-details">
                <span className="secret-name">{secret?.name}</span>
                <span className="secret-subheading">
                  {secret?.purpose == "OPENAI"
                    ? "AI Service API Key"
                    : "Payment Gateway API Key"}
                </span>
              </div>
            </div>

            <div className="secret-actions">
              <button
                className="btn use"
                onClick={() => {
                  if (secret?.purpose == "OPENAI") {
                    navigate(`/chatwithbot/${secret?.value}`);
                  }
                  //redirect to other pages
                }}
              >
                Use
              </button>
              <button
                className="btn lend"
                onClick={() => {
                  navigate(`/lend/secret/${secret?.type}`);
                }}
              >
                Lend
              </button>
              <button
                className="btn borrow"
                onClick={() => {
                  //This feature comes soon
                }}
              >
                Borrow
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export const SharedSecrets = ({
  secretsLs,
  sx,
}: {
  secretsLs: keyType[];
  sx?: CSSProperties;
}): JSX.Element => {
  const navigate = useNavigate();

  // const { openAppDialog, closeAppDialog } = useAppDialog();

  // const decodeChatSecretUrl = async (linkUrl: string) => {
  //   openAppDialog("loading", "Preparing your chat...");
  //   const parsedUrl = new URL(linkUrl as string);
  //   const params = parsedUrl.searchParams;
  //   const scrtId = params.get("id");
  //   const scrtNonce = params.get("nonce");

  //   const { accessToken, conversationID, initialMessage } = await UseOpenAiKey(
  //     scrtId as string,
  //     scrtNonce as string
  //   );

  //   if (accessToken && conversationID && initialMessage) {
  //     closeAppDialog();

  //     navigate(
  //       `/chat/${conversationID}/${accessToken}/${initialMessage}/${scrtNonce}`
  //     );
  //   } else {
  //     openAppDialog(
  //       "failure",
  //       "The secret you are trying to use may have expired. Please try again."
  //     );
  //   }
  // };

  return (
    <div style={sx} id="mysecrets">
      {secretsLs.map((secret, idx) => (
        <div
          className="_secret"
          key={secret?.name + idx}
          // onClick={() =>
          //   openAppDrawerWithKey(
          //     "secretactions",
          //     secret?.value,
          //     secret?.purpose
          //   )
          // }
        >
          <div className="secret-info">
            <img
              src={secret?.purpose == "OPENAI" ? poelogo : awxlogo}
              alt="secret-purpose"
              className="secret-logo"
            />
            <div className="owner">
              <span className="secretname">{secret?.name}</span>

              <span className="sharedfrom">
                <br></br>
                By <User
                  width={12}
                  height={12}
                  color={colors.textprimary}
                />{" "}
                {secret?.owner}
              </span>
            </div>
          </div>

          <div className="secret-actions">
            <button
              className="btn use"
              onClick={() => {
                if (secret?.purpose == "OPENAI") {
                  navigate(`/chatwithbot/${secret?.value}`);
                }
                // WILL DO THE OTHER PART
              }}
            >
              Use
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
