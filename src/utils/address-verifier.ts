import { isAddress as isEthAddress, isValidName } from "ethers"
import sphere from "@/lib/sphere"



export function isAddressValid(address: string, chain?: string) {
    // TODO: check chain specific address validity e.g ethereum | solana | Aptos | Sui
    return isEthAddress(address)
}

export function isEnsValid(ensName: string) {
    return isValidName(ensName)
}

export async function isTgUsernameValid(tgUsername: string) {
    // check for valid usernames - uses phone number for now
    // tgUsername -> phone number
    const { phoneNumber } = await sphere.paymentLinks.getAllUsers();
    const match = phoneNumber?.find(_phone => _phone.toLocaleLowerCase().includes(tgUsername))
    return match ? true : false
}