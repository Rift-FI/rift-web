import { clsx, type ClassValue } from "clsx";
import { formatDistanceToNow, format } from "date-fns";
import { twMerge } from "tailwind-merge";

interface FormatOpts {
  shorten?: boolean;
  leading?: number;
  trailing?: number;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const sleep = (ms: number) => {
  return new Promise((res) => {
    setTimeout(() => {
      res(true);
    }, ms);
  });
};

export const shortenString = (longstring: string, opts: FormatOpts = {}) => {
  const { shorten = true, leading = 4, trailing = 4 } = opts;

  const canonical = longstring;

  if (!shorten) return canonical;

  const l = Math.min(leading, canonical.length);
  const t = Math.min(trailing, canonical.length - l);

  return `${canonical.slice(0, l)}…${canonical.slice(-t)}`;
};

export const dateDistance = (prevdatestr: string): string => {
  return formatDistanceToNow(new Date(prevdatestr), { addSuffix: true });
};

export const formatDateToStr = (
  dateStr: string,
  includesTime?: boolean,
): string => {
  return includesTime
    ? format(new Date(dateStr as string), "eee MMM do y h:m a")
    : format(new Date(dateStr as string), "eee MMM do y");
};

export const formatFloatNumber = (num: number): number => {
  const numValue = Number(num);
  if (typeof numValue === "number" && !isNaN(numValue)) {
    return parseFloat(numValue.toFixed(2));
  } else {
    return 0;
  }
};

export const formatNumberUsd = (amount: number) => {
  const numValue = Number(amount || 0);
  const formattedNumber = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency",
    currency: "USD",
    currencyDisplay: "symbol",
  }).format(numValue);
  return formattedNumber;
};

export const formatNumberWithCommas = (
  amount: number,
  decimals: number = 2,
) => {
  const numValue = Number(amount || 0);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
};
