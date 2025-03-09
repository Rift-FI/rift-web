import { JSX } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

export const FaIcon = ({
  faIcon,
  color,
  fontsize,
}: {
  faIcon: IconProp;
  color: string;
  fontsize?: number;
}): JSX.Element => {
  return (
    <FontAwesomeIcon icon={faIcon} color={color} fontSize={fontsize || 16} />
  );
};
