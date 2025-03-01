import { JSX, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDialog } from "../../hooks/dialog";
import { useAppDrawer } from "../../hooks/drawer";
import { createAirdropCampaign } from "../../utils/api/airdrop";
import { OutlinedTextInput } from "../../components/global/Inputs";
import { SubmitButton } from "../../components/global/Buttons";
import { colors } from "../../constants";
import { NFT } from "../../assets/icons/actions";
import airdrop from "../../assets/images/icons/campaing.png";
import "../../styles/pages/business/startcampaign.scss";

export default function StartCampaign(): JSX.Element {
  const navigate = useNavigate();
  const { showerrorsnack } = useSnackbar();
  const { openAppDialog, closeAppDialog } = useAppDialog();
  const { openAppDrawerWithUrl } = useAppDrawer();

  const [campaignName, setCampaignName] = useState<string>("");
  const [maxSupply, setMaxSupply] = useState<string>("");
  const [qtyPerUser, setQtyPerUser] = useState<string>("");

  const goBack = () => {
    navigate("/business");
  };

  const { mutate: mutateCreateAirdrop, isPending } = useMutation({
    mutationFn: () =>
      createAirdropCampaign(
        campaignName,
        Number(maxSupply),
        Number(qtyPerUser)
      ),
    onSuccess: (data: string) => {
      setCampaignName("");
      setMaxSupply("");
      setQtyPerUser("");
      closeAppDialog();
      openAppDrawerWithUrl("sendairdroplink", data);
    },
    onError: () => {
      openAppDialog(
        "failure",
        `We couldn't create your campaign at the moment, please try again later`
      );
    },
  });

  const onSubmitAirdrop = () => {
    if (campaignName == "" || maxSupply == "" || qtyPerUser == "") {
      showerrorsnack("All fields are required..");
    } else {
      openAppDialog("loading", "Setting up your Airdrop Campaign...");
      mutateCreateAirdrop();
    }
  };

  useBackButton(goBack);

  return (
    <section id="startcampaign">
      <div className="pageicon">
        <img src={airdrop} alt="airdrop" />
      </div>

      <p className="title_desc">
        Airdrop Campaign
        <span>Start an Airdrop Campaign & distribute tokens</span>
      </p>

      <div className="inputs campname">
        <p className="title">
          Campaign Name
          <span>Give your airdrop campaign a name</span>
        </p>

        <OutlinedTextInput
          inputType="text"
          placeholder="Airdrop Campaign Name"
          inputlabalel="Campaign Name"
          inputState={campaignName}
          setInputState={setCampaignName}
          sxstyles={{ marginTop: "0" }}
        />
      </div>

      <div className="inputs">
        <p className="title">
          Supply
          <span>Set a max number of tokens for your campaign</span>
        </p>

        <OutlinedTextInput
          inputType="number"
          placeholder="20,000"
          inputlabalel="Max Supply"
          inputState={maxSupply}
          setInputState={setMaxSupply}
          sxstyles={{ marginTop: "0" }}
        />
      </div>

      <div className="inputs">
        <p className="title">
          Distribution
          <span>How many tokens will each participant receive ?</span>
        </p>

        <OutlinedTextInput
          inputType="number"
          placeholder="10"
          inputlabalel="Tokens Per User"
          inputState={qtyPerUser}
          setInputState={setQtyPerUser}
          sxstyles={{ marginTop: "0" }}
        />
      </div>

      <SubmitButton
        text="Create Campaign"
        icon={
          <NFT
            width={10}
            height={17}
            color={
              campaignName == "" ||
              maxSupply == "" ||
              qtyPerUser == "" ||
              isPending ||
              isPending
                ? colors.textsecondary
                : colors.textprimary
            }
          />
        }
        isDisabled={
          campaignName == "" || maxSupply == "" || qtyPerUser == "" || isPending
        }
        isLoading={isPending}
        sxstyles={{ marginTop: "2rem" }}
        onclick={onSubmitAirdrop}
      />
    </section>
  );
}
