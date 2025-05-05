import { FC } from "react";
import { iconprops } from "../type";

/**
 * Exchange
 * width: number (20)
 * height: number (20)
 * color: string (black)
 */
const Exchange: FC<iconprops> = ({ color, width, height }) => (
  <svg
    width={width ?? 20}
    height={height ?? 20}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 16C1 16.5304 1.21071 17.0391 1.58579 17.4142C1.96086 17.7893 2.46957 18 3 18C3.53043 18 4.03914 17.7893 4.41421 17.4142C4.78929 17.0391 5 16.5304 5 16C5 15.4696 4.78929 14.9609 4.41421 14.5858C4.03914 14.2107 3.53043 14 3 14C2.46957 14 1.96086 14.2107 1.58579 14.5858C1.21071 14.9609 1 15.4696 1 16ZM15 4C15 4.53043 15.2107 5.03914 15.5858 5.41421C15.9609 5.78929 16.4696 6 17 6C17.5304 6 18.0391 5.78929 18.4142 5.41421C18.7893 5.03914 19 4.53043 19 4C19 3.46957 18.7893 2.96086 18.4142 2.58579C18.0391 2.21071 17.5304 2 17 2C16.4696 2 15.9609 2.21071 15.5858 2.58579C15.2107 2.96086 15 3.46957 15 4Z"
      stroke={color ?? "black"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 6V11C17 12.3261 16.4732 13.5979 15.5355 14.5355C14.5979 15.4732 13.3261 16 12 16H9M9 16L12 13M9 16L12 19M3 14V9C3 7.67392 3.52678 6.40215 4.46447 5.46447C5.40215 4.52678 6.67392 4 8 4H11M11 4L8 1M11 4L8 7"
      stroke={color ?? "black"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default Exchange;
