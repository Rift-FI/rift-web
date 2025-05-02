import {
  JSX,
  Dispatch,
  SetStateAction,
  CSSProperties,
  HTMLInputTypeAttribute,
} from "react";
import { TextField } from "@mui/material";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FaIcon } from "@/assets/faicon";
import { colors } from "@/constants";
import "../../styles/components/global/inputs.scss";

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

export const SearchInput = ({
  placeholder,
  inputState,
  setInputState,
  ctrsxstyles,
  inputsxstyles,
}: {
  placeholder: string;
  inputState: string;
  setInputState: Dispatch<SetStateAction<string>>;
  ctrsxstyles?: CSSProperties;
  inputsxstyles?: CSSProperties;
}): JSX.Element => {
  return (
    <div id="searchinput_ctr" style={ctrsxstyles}>
      <FaIcon faIcon={faMagnifyingGlass} color={colors.textsecondary} />

      <input
        type="text"
        id="searchinput"
        placeholder={placeholder}
        value={inputState}
        style={inputsxstyles}
        onChange={(e) => setInputState(e.target.value)}
      />
    </div>
  );
};
