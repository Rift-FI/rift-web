import { FC } from "react";
import { iconprops } from "../type";

/**
 * Arrow right up
 * width: number (8)
 * height: number (8)
 * color: string (black)
 */
const ArrowRightUp: FC<iconprops> = ({ width, height, color }) => (
  <svg
    width={width ?? 8}
    height={height ?? 8}
    viewBox="0 0 8 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1.33333 0V1.33333H5.724L0 7.05733L0.942666 8L6.66667 2.276V6.66667H8V0H1.33333Z"
      fill={color ?? "black"}
    />
  </svg>
);

export default ArrowRightUp;
