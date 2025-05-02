import {
  JSX,
  useEffect,
  useRef,
  useState,
  KeyboardEvent,
  MutableRefObject,
  Dispatch,
  SetStateAction,
  ChangeEvent,
  CSSProperties,
} from "react";
import "../../styles/components/security/pininput.scss";

interface props {
  setDigitVals: Dispatch<SetStateAction<string>>;
  clearInputs?: boolean;
  message?: string;
  sxstyles?: CSSProperties;
}

export const DigitsInput = ({
  setDigitVals,
  clearInputs,
  message,
  sxstyles,
}: props): JSX.Element => {
  const val0ref: MutableRefObject<HTMLInputElement> | null = useRef(null!);
  const val1ref: MutableRefObject<HTMLInputElement> | null = useRef(null!);
  const val2ref: MutableRefObject<HTMLInputElement> | null = useRef(null!);
  const val3ref: MutableRefObject<HTMLInputElement> | null = useRef(null!);

  const [val0, setVal0] = useState<string>("");
  const [val1, setVal1] = useState<string>("");
  const [val2, setVal2] = useState<string>("");
  const [val3, setVal3] = useState<string>("");

  const updateParentDigits = (index: number, value: string) => {
    const digits = [val0, val1, val2, val3];
    digits[index] = value;
    setDigitVals(digits.join(""));
  };

  const focusOnInputChange = (
    ev: ChangeEvent<HTMLInputElement>,
    setVal: Dispatch<SetStateAction<string>>,
    nextRef: MutableRefObject<HTMLInputElement> | null,
    index: number
  ) => {
    ev.preventDefault();
    const value = ev.currentTarget.value;
    const pin = val0 + val1 + val2 + val3;

    setVal(value);
    setDigitVals(pin);
    nextRef?.current?.focus();

    updateParentDigits(index, value);
  };

  const focusOnKeyDown = (
    ev: KeyboardEvent<HTMLInputElement>,
    setVal: Dispatch<SetStateAction<string>>,
    prevRef: MutableRefObject<HTMLInputElement> | null,
    index: number
  ) => {
    if (ev.key === "Backspace" || ev.key === "Delete") {
      ev.preventDefault();
      setVal("");
      prevRef?.current?.focus();

      updateParentDigits(index, "");
    }
  };

  useEffect(() => {
    if (clearInputs) {
      setVal0("");
      setVal1("");
      setVal2("");
      setVal3("");
      setDigitVals("");
      val0ref.current.focus();
    }
  }, [clearInputs]);

  return (
    <div className="digitsinput" style={sxstyles}>
      <div className="inputs">
        <input
          ref={val0ref}
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={val0}
          maxLength={1}
          onChange={(ev) => focusOnInputChange(ev, setVal0, val1ref, 0)}
          onKeyDown={(ev) => focusOnKeyDown(ev, setVal0, null, 0)}
        />

        <input
          ref={val1ref}
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={val1}
          maxLength={1}
          onChange={(ev) => focusOnInputChange(ev, setVal1, val2ref, 1)}
          onKeyDown={(ev) => focusOnKeyDown(ev, setVal1, val0ref, 1)}
        />

        <input
          ref={val2ref}
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={val2}
          maxLength={1}
          onChange={(ev) => focusOnInputChange(ev, setVal2, val3ref, 2)}
          onKeyDown={(ev) => focusOnKeyDown(ev, setVal2, val1ref, 2)}
        />

        <input
          ref={val3ref}
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={val3}
          maxLength={1}
          onChange={(ev) => focusOnInputChange(ev, setVal3, null, 3)}
          onKeyDown={(ev) => focusOnKeyDown(ev, setVal3, val2ref, 3)}
        />
      </div>

      <p className="message">{message}</p>
    </div>
  );
};
