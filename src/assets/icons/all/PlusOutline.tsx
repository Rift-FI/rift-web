import { FC } from "react";
import { iconprops } from "../type";

/**
 * Plus (with transparent background color)
 * width: number (18)
 * height: number (18)
 * color: string (black)
 */
const PlusOutline: FC<iconprops> = ({ width, height, color }) => (
  <svg
    width={width ?? 18}
    height={height ?? 18}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9 18C4.03714 18 0 13.9629 0 9C0 4.03714 4.03714 0 9 0C13.9629 0 18 4.03714 18 9C18 13.9629 13.9629 18 9 18ZM9 1.28571C4.74429 1.28571 1.28571 4.74429 1.28571 9C1.28571 13.2557 4.74429 16.7143 9 16.7143C13.2557 16.7143 16.7143 13.2557 16.7143 9C16.7143 4.74429 13.2557 1.28571 9 1.28571Z"
      fill={color ?? "black"}
    />
    <path
      d="M8.99997 13.5C8.63997 13.5 8.35712 13.2171 8.35712 12.8571V5.14286C8.35712 4.78286 8.63997 4.5 8.99997 4.5C9.35997 4.5 9.64283 4.78286 9.64283 5.14286V12.8571C9.64283 13.2171 9.35997 13.5 8.99997 13.5Z"
      fill={color ?? "black"}
    />
    <path
      d="M12.8571 9.64289H5.14286C4.78286 9.64289 4.5 9.36003 4.5 9.00003C4.5 8.64003 4.78286 8.35718 5.14286 8.35718H12.8571C13.2171 8.35718 13.5 8.64003 13.5 9.00003C13.5 9.36003 13.2171 9.64289 12.8571 9.64289Z"
      fill={color ?? "black"}
    />
  </svg>
);

export default PlusOutline;
