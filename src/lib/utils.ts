import { clsx, type ClassValue } from "clsx";
import { formatDistanceToNow, format } from "date-fns";
import { twMerge } from "tailwind-merge";

interface FormatOpts {
  /** Shorten the string with a middle ellipsis (default = true) */
  shorten?: boolean;
  /** Visible chars at the front (default = 4) */
  leading?: number;
  /** Visible chars at the end  (default = 4) */
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
  includesTime?: boolean
): string => {
  return includesTime
    ? format(new Date(dateStr as string), "eee MMM do y h:m a")
    : format(new Date(dateStr as string), "eee MMM do y");
};

export const formatNumberUsd = (amount: number) => {
  const formattedNumber = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
    style: "currency",
    currency: "USD",
    currencyDisplay: "symbol",
  }).format(Number(amount));
  return formattedNumber;
};

export const base64ToString = (base64: string | null) => {
  try {
    if (!base64) throw new Error("Base64 string is missing");
    return decodeURIComponent(escape(atob(base64)));
  } catch (error) {
    return null;
  }
};

export const stringToBase64 = (value: string) => {
  return btoa(unescape(encodeURIComponent(value)));
};
