import { CSSProperties, JSX } from "react";
import { colors } from "../../constants";
import "../../styles/components/global/radios.scss";

interface props {
  title: string;
  description: string;
  ischecked: boolean;
  sxstyles?: CSSProperties;
  onclick: () => void;
}

export const RadioButton = ({
  title,
  description,
  ischecked,
  sxstyles,
  onclick,
}: props): JSX.Element => {
  return (
    <div className="radio_btn_ctr" style={sxstyles} onClick={onclick}>
      <div className="radio_ctr">
        <div
          style={{
            backgroundColor: ischecked ? colors.textprimary : colors.primary,
          }}
        />
      </div>

      <p className="text_alt_text">
        {title}
        <span>{description}</span>
      </p>
    </div>
  );
};
