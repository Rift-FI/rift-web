import { FC } from "react";
import { iconprops } from "../type";

/**
 * Search/Find
 * width: number (22)
 * height: number (22)
 * color: string (black)
 */
const Rotate: FC<iconprops> = ({ width, height, color }) => (
  <svg
    width={width ?? 22}
    height={height ?? 22}
    viewBox="0 0 22 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16.5 16.5L21 21M19 10C19 7.61305 18.0518 5.32387 16.364 3.63604C14.6761 1.94821 12.3869 1 10 1C7.61305 1 5.32387 1.94821 3.63604 3.63604C1.94821 5.32387 1 7.61305 1 10C1 12.3869 1.94821 14.6761 3.63604 16.364C5.32387 18.0518 7.61305 19 10 19C12.3869 19 14.6761 18.0518 16.364 16.364C18.0518 14.6761 19 12.3869 19 10Z"
      stroke={color ?? "black"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default Rotate;
