import { clsx, type ClassValue } from "clsx"
import { formatDistanceToNow, format } from "date-fns"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const sleep = (ms: number) => {
  return new Promise((res) => {
    setTimeout(() => {
      res(true)

    }, ms)
  })
}

export const shortenString = (longstring: string) => {
  return `${longstring.slice(0, 6)}...${longstring.slice(-4)}`;
}

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
}

export const base64ToString = (base64: string | null): string => {
  try {
    if (!base64) throw new Error("Base64 string is missing");
    return decodeURIComponent(escape(atob(base64)));
  } catch (error) {
    return "Invalid value";
  }
};

export const stringToBase64 = (value: string) => {
  return btoa(unescape(encodeURIComponent(value)));
};

