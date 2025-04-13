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

  // Log when any digit state changes
  useEffect(() => {
    console.log(
      `DigitsInput: States - val0:${val0}, val1:${val1}, val2:${val2}, val3:${val3}`
    );
  }, [val0, val1, val2, val3]);

  const focusOnInputChange = (
    ev: ChangeEvent<HTMLInputElement>,
    setVal: Dispatch<SetStateAction<string>>,
    nextRef: MutableRefObject<HTMLInputElement> | null,
    index: number
  ) => {
    ev.preventDefault();

    // Get the latest value from the input
    const value = ev.currentTarget.value.slice(-1);

    // Only allow numeric input
    if (!/^\d*$/.test(value)) {
      return;
    }

    // Log the input for debugging
    console.log(
      `DigitsInput: Input changed at index ${index} to value ${value}`
    );

    // Update the state with the new value
    setVal(value);

    // Focus next input if value is entered
    if (value && nextRef?.current) {
      nextRef.current.focus();
    }

    // Use setTimeout to ensure the state is updated before calling updateParentDigits
    setTimeout(() => {
      let digits = [val0, val1, val2, val3];
      // For the current digit, use the new value directly
      digits[index] = value;

      // Generate the OTP by joining the digits
      const newOtpValue = digits.join("");
      console.log(`DigitsInput: Updating parent with: ${newOtpValue}`);

      // Update the parent component
      setDigitVals(newOtpValue);
    }, 0);
  };

  const focusOnKeyDown = (
    ev: KeyboardEvent<HTMLInputElement>,
    setVal: Dispatch<SetStateAction<string>>,
    prevRef: MutableRefObject<HTMLInputElement> | null,
    index: number
  ) => {
    if (ev.key === "Backspace" || ev.key === "Delete") {
      ev.preventDefault();
      console.log(`DigitsInput: Deleting digit at index ${index}`);

      // Clear the value
      setVal("");

      // Focus on the previous input
      prevRef?.current?.focus();

      // Update the parent digits
      setTimeout(() => {
        let digits = [val0, val1, val2, val3];
        digits[index] = "";
        const newOtpValue = digits.join("");
        console.log(`DigitsInput: After delete, new OTP: ${newOtpValue}`);
        setDigitVals(newOtpValue);
      }, 0);
    }
  };

  useEffect(() => {
    if (clearInputs) {
      console.log("DigitsInput: Clearing all inputs");
      setVal0("");
      setVal1("");
      setVal2("");
      setVal3("");
      setDigitVals("");
      val0ref.current.focus();
    }
  }, [clearInputs, setDigitVals]);

  // This effect monitors when the parent component resets the OTP value
  useEffect(() => {
    // Listen for when the OTP is reset externally (when parent component sets it to empty)

    // Create a mutation observer to watch for changes to the input values
    const observer = new MutationObserver(() => {
      // Check if all inputs are empty when they shouldn't be
      if (val0 === "" && val1 === "" && val2 === "" && val3 === "") {
        console.log("DigitsInput: All inputs are empty, focusing first input");
        val0ref.current?.focus();
      }
    });

    // Start observing the inputs
    Array.from(document.querySelectorAll(".digitsinput input")).forEach(
      (input) => {
        observer.observe(input, { attributes: true, childList: true });
      }
    );

    return () => {
      observer.disconnect();
    };
  }, []);

  // Add a prop to allow parent to reset values
  useEffect(() => {
    // Check if parent is trying to reset (external setOtpCode(""))
    const checkAndResetIfNeeded = () => {
      // We don't have direct access to parent's value, so check if we should be empty
      if (val0 !== "" || val1 !== "" || val2 !== "" || val3 !== "") {
        // Get current value in parent
        const currentOtp = [val0, val1, val2, val3].join("");

        // If we have some value in inputs but parent wants it empty, reset
        if (currentOtp.length > 0) {
          setTimeout(() => {
            const inputsValue = [val0, val1, val2, val3].join("");
            // If we still have a value but parent doesn't want it, force reset
            if (inputsValue.length > 0) {
              console.log(
                "DigitsInput: Delayed check - inputs should be reset"
              );
              setVal0("");
              setVal1("");
              setVal2("");
              setVal3("");
            }
          }, 100);
        }
      }
    };

    // Check on mount and periodically
    checkAndResetIfNeeded();
    const interval = setInterval(checkAndResetIfNeeded, 1000);

    return () => clearInterval(interval);
  }, [val0, val1, val2, val3]);

  return (
    <div className="digitsinput" style={sxstyles}>
      <div className="inputs">
        <input
          ref={val0ref}
          type="text"
          inputMode="numeric"
          placeholder="0"
          className={val0 !== "" ? "valueinput" : ""}
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
          className={val1 !== "" ? "valueinput" : ""}
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
          className={val2 !== "" ? "valueinput" : ""}
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
          className={val3 !== "" ? "valueinput" : ""}
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
