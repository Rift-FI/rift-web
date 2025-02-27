import { JSX, useState } from "react";
import { TextField } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDialog } from "../../hooks/dialog";
import { useAppDrawer } from "../../hooks/drawer";
import { createAirdropCampaign } from "../../utils/api/airdrop";
import airdrop from "../../assets/images/icons/campaing.png";
import { colors } from "../../constants";
import { NFT } from "../../assets/icons/actions";
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

        <TextField
          value={campaignName}
          onChange={(ev) => setCampaignName(ev.target.value)}
          label="Airdrop Campaign Name"
          placeholder="campaign name"
          fullWidth
          variant="outlined"
          autoComplete="off"
          type="text"
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: colors.divider,
              },
              "& input": {
                color: colors.textprimary,
              },
              "&::placeholder": {
                color: colors.textsecondary,
                opacity: 1,
              },
            },
            "& .MuiInputLabel-root": {
              color: colors.textsecondary,
              fontSize: "0.875rem",
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: colors.accent,
            },
          }}
        />
      </div>

      <div className="inputs">
        <p className="title">
          Supply
          <span>Set a max number of tokens for your campaign</span>
        </p>

        <TextField
          value={maxSupply}
          onChange={(ev) => setMaxSupply(ev.target.value)}
          label="Max Supply"
          placeholder="2000"
          fullWidth
          variant="outlined"
          autoComplete="off"
          type="number"
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: colors.divider,
              },
              "& input": {
                color: colors.textprimary,
              },
              "&::placeholder": {
                color: colors.textsecondary,
                opacity: 1,
              },
            },
            "& .MuiInputLabel-root": {
              color: colors.textsecondary,
              fontSize: "0.875rem",
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: colors.accent,
            },
          }}
        />
      </div>

      <div className="inputs">
        <p className="title">
          Distribution
          <span>How many tokens will each participant receive ?</span>
        </p>

        <TextField
          value={qtyPerUser}
          onChange={(ev) => setQtyPerUser(ev.target.value)}
          label="Tokens Per User"
          placeholder="10"
          fullWidth
          variant="outlined"
          autoComplete="off"
          type="number"
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: colors.divider,
              },
              "& input": {
                color: colors.textprimary,
              },
              "&::placeholder": {
                color: colors.textsecondary,
                opacity: 1,
              },
            },
            "& .MuiInputLabel-root": {
              color: colors.textsecondary,
              fontSize: "0.875rem",
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: colors.accent,
            },
          }}
        />
      </div>

      <button disabled={isPending} onClick={onSubmitAirdrop} className="submit">
        Create Camapign&nbsp;
        <NFT
          width={10}
          height={17}
          color={isPending ? colors.textsecondary : colors.textprimary}
        />
        &nbsp;
      </button>
    </section>
  );
}
