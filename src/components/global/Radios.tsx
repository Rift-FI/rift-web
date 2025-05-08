import { CSSProperties, JSX } from "react";
import { Check, Clock } from "../../assets/icons";
import { colors } from "../../constants";
import "../../styles/components/global/radios.scss";

interface radioProps {
  image: string;
  title: string;
  description: string;
  ischecked: boolean;
  sxstyles?: CSSProperties;
  onclick: () => void;
}

export const RadioButton = ({
  image,
  title,
  description,
  ischecked,
  sxstyles,
  onclick,
}: radioProps): JSX.Element => {
  return (
    <div
      id="radio_btn_ctr"
      className={ischecked ? "checked" : ""}
      style={sxstyles}
      onClick={onclick}
    >
      <div className="img_title_desc">
        <img src={image} alt="image" />

        <p>
          {title} <span>{description}</span>
        </p>
      </div>

      <Check color={ischecked ? colors.success : colors.divider} />
    </div>
  );
};

export const CurrencyPicker = ({
  image,
  title,
  description,
  ischecked,
  sxstyles,
  onclick,
}: Partial<radioProps>): JSX.Element => {
  return (
    <div
      id="currencypicker"
      className={ischecked ? "checked" : ""}
      style={sxstyles}
      onClick={onclick}
    >
      <div className="img_title_desc">
        <img src={image} alt="image" />
        <p>
          {title} <span>{description}</span>
        </p>
      </div>

      <span className="icon">
        <Check color={ischecked ? colors.success : colors.divider} />
      </span>
    </div>
  );
};

export const TimePicker = ({
  title,
  description,
  ischecked,
  sxstyles,
  onclick,
}: Partial<radioProps>): JSX.Element => {
  return (
    <div
      id="currencypicker"
      className={ischecked ? "checked" : ""}
      style={sxstyles}
      onClick={onclick}
    >
      <div className="img_title_desc">
        <Clock color={colors.accent} />

        <p>
          {title} <span>{description}</span>
        </p>
      </div>

      <span className="icon">
        <Check color={ischecked ? colors.success : colors.divider} />
      </span>
    </div>
  );
};
