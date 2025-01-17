import { useReadContract } from "wagmi";
import { ethers } from "ethers";

const GaslessABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "GaslessTransfer__NotEnoughAllowance",
    type: "error",
  },
  {
    inputs: [],
    name: "GaslessTransfer__NotEnoughBalance",
    type: "error",
  },
  {
    inputs: [],
    name: "GaslessTransfer__PermitFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "GaslessTransfer__TransferFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token",
    outputs: [
      { internalType: "contract IERC20Permit", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_owner", type: "address" },
      { internalType: "uint256", name: "_value", type: "uint256" },
      { internalType: "uint256", name: "_deadline", type: "uint256" },
      { internalType: "uint8", name: "_v", type: "uint8" },
      { internalType: "bytes32", name: "_r", type: "bytes32" },
      { internalType: "bytes32", name: "_s", type: "bytes32" },
      { internalType: "address", name: "_to", type: "address" },
      { internalType: "uint256", name: "_charge", type: "uint256" },
    ],
    name: "transfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const PERMIT_ABI = [
  {
    constant: true,
    inputs: [{ name: "owner", type: "address" }],
    name: "nonces",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
] as const;

export function usePermitSign() {
  const tokenAddress = "0xc750f8B015AEE3C3DC75404F0196FC35A37edE20"; // token address
  const address = "0x329f618f5BC58295789568B3E409F9e31725F667"; // user address
  const spender = "0xc3817368e045B85F39F25aBF8BCA2827A93a3fd8"; // contract address

  const { data: nonce } = useReadContract({
    address: tokenAddress,
    abi: PERMIT_ABI,
    functionName: "nonces",
    args: address ? [address] : undefined,
  });

  const signPermit = async (value: bigint, name: string) => {
    const provider = new ethers.InfuraProvider(
      "sepolia",
      "b63c0b03df1e46a08d801f0f48f09e91"
    );
    const signer = new ethers.Wallet(
      "1b51efdecdeb3ba40ae2d29f7abb5b4a080661996b43ea6967049b0a55d52a63",
      provider
    );

    const formattedValue = ethers.parseUnits(value.toString(), 18);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now

    const domain = {
      name,
      version: "1",
      chainId: 11155111,
      verifyingContract: tokenAddress,
    };

    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const message = {
      owner: address,
      spender,
      value: formattedValue,
      nonce: nonce || 0n,
      deadline,
      charge: 2,
      recipient: "0x092395BCE82076553Ea862035CBb6c0993F0FdAC",
    };

    try {
      const signatureHex = await signer.signTypedData(domain, types, message);
      const sig = ethers.Signature.from(signatureHex);

      const signatureData = {
        v: sig.v,
        r: sig.r,
        s: sig.s,
        deadline,
        value,
        signature: signatureHex,
      };

      const contract = new ethers.Contract(spender, GaslessABI, signer);
      let tx_res = await contract.transfer(
        message.owner,
        message.value,
        deadline,
        signatureData.v,
        signatureData.r,
        signatureData.s,
        message.recipient,
        message.charge,
        { gasLimit: BigInt("1000000") }
      );
      console.log(tx_res);
    } catch (error) {
      throw error;
    }
  };

  return { signPermit };
}
