export const numberFormat = (num: number): string => {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(2).replace(/\.?0+$/, "") + "B";
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(2).replace(/\.?0+$/, "") + "K";
  } else {
    return num.toString();
  }
};

export const formatUsd = (num: number): string => {
  const usdFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "symbol",
  });

  return usdFormatter.format(num);
};

export const formatLargeUsd = (num: number): string => {
  if (num >= 1e9) {
    return "$" + (num / 1e9).toFixed(2).replace(/\.?0+$/, "") + "B";
  } else if (num >= 1e6) {
    return "$" + (num / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
  } else if (num >= 1e3) {
    return "$" + (num / 1e3).toFixed(2).replace(/\.?0+$/, "") + "K";
  } else {
    return "$" + num.toFixed(2).replace(/\.?0+$/, "");
  }
};

export const formatNumber = (num: number): number => {
  if (Number.isInteger(num)) {
    return num;
  } else if (typeof num === "number" && !isNaN(num)) {
    return parseFloat(num.toFixed(2));
  } else {
    return 0;
  }
};
