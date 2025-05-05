import { FC } from "react";
import { iconprops } from "../type";

/**
 * Chevron down
 * width: number (10)
 * height: number (6)
 * color: string (black)
 */
const ChevronDown: FC<iconprops> = ({ width, height, color }) => (
  <svg
    width={width ?? 10}
    height={height ?? 6}
    viewBox="0 0 10 6"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.83751 0.873705C9.94156 0.757795 10 0.600673 10 0.436853C10 0.273032 9.94156 0.115911 9.83751 0H0.16249C0.0584423 0.115911 0 0.273032 0 0.436853C0 0.600673 0.0584423 0.757795 0.16249 0.873705L4.60737 5.81921C4.71155 5.93498 4.85276 6 5 6C5.14724 6 5.28845 5.93498 5.39263 5.81921L9.83751 0.873705Z"
      fill={color ?? "black"}
      fillOpacity="0.6"
    />
  </svg>
);

export default ChevronDown;
