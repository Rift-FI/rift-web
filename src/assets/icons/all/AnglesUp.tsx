import { FC } from "react";
import { iconprops } from "../type";

/**
 * Angles up/double chevrons up
 * width: number (10)
 * height: number (12)
 * color: string (black)
 */
const AnglesUp: FC<iconprops> = ({ width, height, color }) => (
  <svg
    width={width ?? 10}
    height={height ?? 12}
    viewBox="0 0 10 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 11L5 7L9 11M1 5L5 1L9 5"
      stroke={color ?? "black"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default AnglesUp;
