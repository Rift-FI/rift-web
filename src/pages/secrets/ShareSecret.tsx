import { JSX, useEffect, useState } from "react";
import { backButton, retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { useNavigate, useParams } from "react-router";
import { Checkbox, Slider, TextField } from "@mui/material";
import { useTabs } from "../../hooks/tabs";
import { useSnackbar } from "../../hooks/snackbar";
import { ShareKeyWithOtherUser } from "../../utils/api/keys";
import { SnackBar } from "../../components/global/SnackBar";
import sharekey from "../../assets/images/secrets.png";
import { colors } from "../../constants";
import { Loading } from "../../assets/animations";
import { Share } from "../../assets/icons";
import "../../styles/pages/sharesecret.css";

export default function ShareSecret(): JSX.Element {
  const { key, purpose } = useParams();
  const navigate = useNavigate();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { switchtab } = useTabs();

  const [keytargetusr, setkeytargetusr] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [time, setTime] = useState<number>(30);
  const [noExpiry, setNoExpiry] = useState<boolean>(false);

  const marks = [
    { value: 30, label: "30" },
    { value: 60, label: "60" },
    { value: 90, label: "90" },
  ];

  const goBack = () => {
    navigate(-1);
  };

  const goToSecurity = () => {
    switchtab("security");
    navigate("/");
  };

  const handleChange = (_event: Event, newValue: number | number[]) => {
    setTime(newValue as number);
  };

  const onShareKey = async () => {
    if (keytargetusr == "") {
      showerrorsnack(`Enter the receipient's telegram username`);
    } else {
      setProcessing(true);

      let token: string | null = localStorage.getItem("token");
      let { initData } = retrieveLaunchParams();

      const { isOk } = await ShareKeyWithOtherUser(
        token as string,
        String(key).substring(0, 4),
        "foreign",
        key as string,
        initData?.user?.username as string,
        noExpiry ? "1000d" : `${time}m`,
        keytargetusr,
        purpose as string
      );

      if (isOk) {
        showsuccesssnack("Key was shared successfully");
      } else {
        showerrorsnack("An unexpected error occurred");
      }

      setProcessing(false);
    }
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
    <div id="authorise">
      <img src={sharekey} alt="share key" />

      <p className="title">
        Share Your Secret(s) with another Telegram User by entering their
        telegram username
      </p>

      <TextField
        value={keytargetusr}
        onChange={(ev) => setkeytargetusr(ev.target.value)}
        label="Telegram Username"
        placeholder="telegram-username"
        fullWidth
        variant="standard"
        autoComplete="off"
        type="email"
        sx={{
          marginTop: "1.25rem",
          "& .MuiInputBase-input": {
            color: colors.textprimary,
          },
          "& .MuiInputLabel-root": {
            color: colors.textsecondary,
          },
          "& .MuiInput-underline:before": {
            borderBottomColor: colors.textsecondary,
          },
          "& .MuiInput-underline:hover:before": {
            borderBottomColor: colors.textsecondary,
          },
          "& .MuiInput-underline:after": {
            borderBottomColor: colors.accent,
          },
        }}
      />

      <p className="keyshare">
        <span>Key</span> <br />
        {String(key).substring(0, 31)}...
      </p>

      <p className="timevalidlabel">
        Access Duration
        <br />
        <span>Set a time limit or select 'no expiry' for unlimited access</span>
      </p>

      <p className="valid_minutes">{time} minutes</p>
      <Slider
        value={time}
        onChange={handleChange}
        marks={marks}
        step={null}
        min={30}
        max={90}
        valueLabelDisplay="on"
        slotProps={{ valueLabel: { style: { color: colors.textprimary } } }}
        sx={{
          marginTop: "1.5rem",
          "& .MuiSlider-markLabel": {
            fontSize: "0.75rem",
            color: colors.textprimary,
          },
          "& .MuiSlider-thumb": {
            backgroundColor: colors.accent,
          },
          "& .MuiSlider-track": {
            backgroundColor: colors.accent,
          },
          "& .MuiSlider-rail": {
            backgroundColor: colors.textsecondary,
          },
          "& .MuiSlider-valueLabel": {
            fontSize: "0.625rem",
            color: colors.textprimary,
            backgroundColor: colors.accent,
          },
        }}
      />

      <div className="noexpiry">
        <Checkbox
          checked={noExpiry}
          onChange={(e) => setNoExpiry(e.target.checked)}
          disableRipple
          sx={{
            color: colors.textsecondary,
            paddingLeft: "unset",
            "&.Mui-checked": {
              color: colors.accent,
            },
          }}
        />

        <p>
          No Expiry <br />
          <span>The link you share will not expire</span>
        </p>
      </div>

      <button
        disabled={processing || keytargetusr == ""}
        className="submitlogin"
        onClick={onShareKey}
      >
        {processing ? (
          <Loading width="1.5rem" height="1.5rem" />
        ) : (
          <>
            Share Secret
            <Share width={14} height={16} color={colors.textprimary} />
          </>
        )}
      </button>

      <p onClick={goToSecurity} className="learnmore">
        Learn how we secure your secrets
      </p>

      <SnackBar />
    </div>
  );
}
