import { IconCopy } from "@tabler/icons-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

const txns = [
  {
    address: "0x4a20dBE962A8c9F16588d28b22f618DA662752ff",
    paymentStatus: "Paid",
    totalAmount: "$20.00",
    type: "Airdrops",
  },
  {
    address: "0x0C378FeB5B57ab949D6F4c53B0BC3e07bB4191a4",
    paymentStatus: "Pending",
    totalAmount: "$10.00",
    type: "Airdrops",
  },
  {
    address: "0x0Ce0c94C64F39c070CD04aF581777581097d6d3a",
    paymentStatus: "Unpaid",
    totalAmount: "$35.00",
    type: "Airdrops",
  },
  {
    address: "0x021bA634036FE5D73113db87Fbf5e891892EC17c",
    paymentStatus: "Paid",
    totalAmount: "$45.00",
    type: "Tokens",
  },
  {
    address: "0x0e09e7F096ba330FC19f17BBec4B436B7d16876a",
    paymentStatus: "Paid",
    totalAmount: "550",
    type: "Points",
  },
  {
    address: "0x01D47D278F9CC7B20A4505213D4cddFd5b75C4de",
    paymentStatus: "Pending",
    totalAmount: "200",
    type: "Tokens",
  },
  {
    address: "0x01F6307eAb7607f70BA0F50F6F2693b82f0965de",
    paymentStatus: "Unpaid",
    totalAmount: "$30.00",
    type: "Airdrop",
  },
];

export function TxnTable() {
  return (
    <Table className="px-2">
      <TableHeader>
        <TableRow className="text-textsecondary">
          <TableHead className="w-[100px]">Address</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="text-gray-300">
        {txns.map((txn) => (
          <TableRow key={txn.address}>
            <TableCell className="font-medium flex gap-1 justify-between w-[100px]">
              {`
                        ${txn.address.slice(0, 6)}...
                    `}
              <IconCopy
                size={12}
                className="cursor-pointer hover:text-[#1a7]"
              />
            </TableCell>
            <TableCell>{txn.type}</TableCell>
            <TableCell className="text-right">{txn.totalAmount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
