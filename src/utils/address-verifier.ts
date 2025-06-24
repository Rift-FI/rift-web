import { isAddress as isEthAddress, isValidName } from "ethers";
import sphere from "@/lib/sphere";

export function isAddressValid(address: string, chain?: string) {
  // TODO: check chain specific address validity e.g ethereum | solana | Aptos | Sui
  return isEthAddress(address);
}

export function isEnsValid(ensName: string) {
  return isValidName(ensName);
}

export async function isTgUsernameValid(tgUsername: string) {
  // check for valid usernames - uses phone number for now
  // tgUsername -> phone number
  const { phoneNumber } = await sphere.paymentLinks.getAllUsers();
  const match = phoneNumber?.find((_phone) =>
    _phone.toLocaleLowerCase().includes(tgUsername)
  );

  return match;
}

export function isEmailValid(email: string) {
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isExternalIdValid(externalId: string) {
  // Basic external ID validation - should be at least 3 characters
  // and not contain special characters that might interfere with other formats
  const trimmed = externalId.trim();
  if (trimmed.length < 3) return false;

  // Make sure it's not an email (contains @)
  if (trimmed.includes("@")) return false;

  // Make sure it's not a wallet address (starts with 0x)
  if (trimmed.startsWith("0x")) return false;

  // Make sure it's not a telegram username (starts with @)
  if (trimmed.startsWith("@")) return false;

  return true;
}
