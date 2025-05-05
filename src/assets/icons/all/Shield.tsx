import { FC } from "react";
import { iconprops } from "../type";

/**
 * Shield
 * width: number (16)
 * height: number (20)
 * color: string (black)
 */
const Shield: FC<iconprops> = ({ color, width, height }: iconprops) => (
  <svg
    width={width ?? 16}
    height={height ?? 20}
    viewBox="0 0 16 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8.09887 18.982C8.03501 19.006 7.96499 19.006 7.90112 18.982C7.05238 18.676 1 16.246 1 9.32679V3.07356C0.999817 2.99312 1.02583 2.91494 1.07388 2.85149C1.12193 2.78803 1.18926 2.74296 1.26513 2.72345L7.91512 1.01075C7.97085 0.996418 8.02915 0.996418 8.08487 1.01075L14.7349 2.72345C14.8107 2.74296 14.8781 2.78803 14.9261 2.85149C14.9742 2.91494 15.0002 2.99312 15 3.07356V9.32679C15 16.3153 8.9485 18.6841 8.09887 18.9829V18.982Z"
      stroke={color ?? "black"}
      strokeWidth="1.5"
      strokeMiterlimit="10"
      strokeLinejoin="round"
    />
  </svg>
);

export default Shield;
