import { clsx, type ClassValue } from "clsx"
import { formatDistanceToNow } from "date-fns"
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

