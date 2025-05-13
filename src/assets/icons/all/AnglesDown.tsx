import { FC } from "react";
import { iconprops } from "../type";

/**
 * Angles down/double chevrons down
 * width: number (10)
 * height: number (12)
 * color: string (black)
 */
const AnglesDown: FC<iconprops> = ({ width, height, color }) => (
  <svg
    width={width ?? 10}
    height={height ?? 12}
    viewBox="0 0 10 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9 1L5 5L1 1M9 7L5 11L1 7"
      stroke={color ?? "black"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default AnglesDown;
