import { isAddress as isEthAddress, isValidName } from "ethers"



export function isAddressValid(address: string, chain?: string) {
    // TODO: check chain specific address validity e.g ethereum | solana | Aptos | Sui
    return isEthAddress(address)
}

export function isEnsValid(ensName: string) {
    return isValidName(ensName)
}