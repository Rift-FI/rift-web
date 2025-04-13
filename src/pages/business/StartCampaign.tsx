import { JSX, useState } from "react";
import { useNavigate } from "react-router";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDialog } from "../../hooks/dialog";
import { useAppDrawer } from "../../hooks/drawer";
import { useBackButton } from "../../hooks/backbutton";
import { useMutation } from "@tanstack/react-query";
import { createAirdropCampaign } from "../../utils/api/airdrop";
import { OutlinedTextInput } from "../../components/global/Inputs";
import { SubmitButton } from "../../components/global/Buttons";
import { NFT } from "../../assets/icons/actions";
import { colors } from "../../constants";
import airdrop from "../../assets/images/icons/campaing.png";

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
    <section className="min-h-screen bg-[#0e0e0e] px-4 py-6 pb-24">
      {/* Header Section */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-[#ffb386]/10 flex items-center justify-center mb-4">
          <img src={airdrop} alt="airdrop" className="w-10 h-10" />
        </div>
        <h1 className="text-[#f6f7f9] text-2xl font-bold mb-2">
          Airdrop Campaign
        </h1>
        <p className="text-gray-400">
          Start an Airdrop Campaign & distribute tokens
        </p>
      </div>

      {/* Form Section */}
      <div className="space-y-6">
        {/* Campaign Name */}
        <div className="space-y-2">
          <div>
            <h2 className="text-[#f6f7f9] font-medium">Campaign Name</h2>
            <p className="text-gray-400 text-sm">
              Give your airdrop campaign a name
            </p>
          </div>
          <OutlinedTextInput
            inputType="text"
            placeholder="Airdrop Campaign Name"
            inputlabalel="Campaign Name"
            inputState={campaignName}
            setInputState={setCampaignName}
            sxstyles={{ marginTop: "0" }}
          />
        </div>

        {/* Max Supply */}
        <div className="space-y-2">
          <div>
            <h2 className="text-[#f6f7f9] font-medium">Supply</h2>
            <p className="text-gray-400 text-sm">
              Set a max number of tokens for your campaign
            </p>
          </div>
          <OutlinedTextInput
            inputType="number"
            placeholder="20,000"
            inputlabalel="Max Supply"
            inputState={maxSupply}
            setInputState={setMaxSupply}
            sxstyles={{ marginTop: "0" }}
          />
        </div>

        {/* Distribution */}
        <div className="space-y-2">
          <div>
            <h2 className="text-[#f6f7f9] font-medium">Distribution</h2>
            <p className="text-gray-400 text-sm">
              How many tokens will each participant receive?
            </p>
          </div>
          <OutlinedTextInput
            inputType="number"
            placeholder="10"
            inputlabalel="Tokens Per User"
            inputState={qtyPerUser}
            setInputState={setQtyPerUser}
            sxstyles={{ marginTop: "0" }}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0e0e0e]">
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
                isPending
                  ? colors.textsecondary
                  : "#000"
              }
            />
          }
          isDisabled={
            campaignName == "" ||
            maxSupply == "" ||
            qtyPerUser == "" ||
            isPending
          }
          isLoading={isPending}
          sxstyles={{ marginTop: "0" }}
          onclick={onSubmitAirdrop}
        />
      </div>
    </section>
  );
}
