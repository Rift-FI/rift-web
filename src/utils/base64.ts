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
