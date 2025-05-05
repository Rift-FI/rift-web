import { FC } from "react";
import { iconprops } from "../type";

/**
 * Arrow right
 * width: number (14)
 * height: number (10)
 * color: string (black)
 */
const ArrowRight: FC<iconprops> = ({ width, height, color }) => (
  <svg
    width={width ?? 14}
    height={height ?? 10}
    viewBox="0 0 14 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9 9L13 5M13 5L9 1M13 5H1"
      stroke={color ?? "black"}
      strokeWidth="1.5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ArrowRight;
