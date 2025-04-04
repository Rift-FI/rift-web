import {
  JSX,
  Dispatch,
  SetStateAction,
  CSSProperties,
  HTMLInputTypeAttribute,
} from "react";
import { TextField } from "@mui/material";
import { colors } from "../../constants";

type inputProps = {
  inputType: HTMLInputTypeAttribute;
  placeholder: string;
  inputlabalel: string;
  inputState: string;
  autofocus?: boolean;
  setInputState: Dispatch<SetStateAction<string>>;
  onkeyup?: () => void;
  hasError?: boolean;
  isDisabled?: boolean;
  sxstyles?: CSSProperties;
};

export const OutlinedTextInput = ({
  inputType,
  placeholder,
  inputlabalel,
  inputState,
  autofocus,
  setInputState,
  onkeyup,
  hasError,
  isDisabled,
  sxstyles,
}: inputProps): JSX.Element => {
  return (
    <TextField
      value={inputState}
      onChange={(ev) => setInputState(ev.target.value)}
      label={inputlabalel}
      placeholder={placeholder}
      fullWidth
      disabled={isDisabled}
      error={hasError}
      variant="outlined"
      autoComplete="off"
      autoFocus={autofocus}
      type={inputType}
      onKeyUp={onkeyup}
      sx={{
        marginTop: "1.5rem",
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
          color: "#ffb386",
        },
        ...sxstyles,
      }}
    />
  );
};
