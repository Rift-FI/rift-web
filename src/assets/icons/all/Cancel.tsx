import { FC } from "react";
import { iconprops } from "../type";

/**
 * Cancel
 * width: number (10)
 * height: number (10)
 * color: string (black)
 */
const Cancel: FC<iconprops> = ({ width, height, color }) => (
  <svg
    width={width ?? 10}
    height={height ?? 10}
    viewBox="0 0 10 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 1L9 9M1 9L9 1"
      stroke={color ?? "black"}
      strokeOpacity="0.6"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default Cancel;
