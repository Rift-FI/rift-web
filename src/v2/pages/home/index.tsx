import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IoArrowUpCircle, IoArrowDownCircle } from "react-icons/io5";
import { MdFilterAltOff } from "react-icons/md";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import { useDisclosure } from "@/hooks/use-disclosure";
import useChainsBalance from "@/hooks/wallet/use-chains-balances";
import useAnalaytics from "@/hooks/use-analytics";
import RedirectLinks from "@/features/redirectlinks";
import BuyCrypto from "@/features/buycrypto";
import { ReceiveDrawer } from "@/features/receive/ReceiveDrawer";
import { SendDrawer } from "@/features/send/SendDrawer";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { FaFilter } from "react-icons/fa";
import useTokens from "@/hooks/data/use-tokens";
import useChains from "@/hooks/data/use-chains";
import useChain from "@/hooks/data/use-chain";
import ActionButton from "./components/ActionButton";
import TokenCard from "./components/TokenCard";
import { TokenSketleton } from "./components/TokenSketleton";
import { Button } from "@/components/ui/button";
import { formatNumberUsd, formatFloatNumber } from "@/lib/utils";
import { WalletChain } from "@/lib/entities";

const filter_schema = z.object({
  filterChainId: z.string().optional(),
});

type FILTER_SCHEMA_TYPE = z.infer<typeof filter_schema>;

export default function Home() {
  const { data: AGGREGATE_BALANCE } = useChainsBalance();
  const { data: ALL_TOKENS, isPending: ALL_TOKENS_PENDING } = useTokens({});
  const { data: CHAINS } = useChains();
  const { logEvent } = useAnalaytics();
  const { isOpen, onClose, onOpen, toggle } = useDisclosure();
  const receive_disclosure = useDisclosure();
  const send_disclosure = useDisclosure();

  const [isRedirectDrawerOpen, setIsRedirectDrawerOpen] = useState(false);
  const [redirectType, setRedirectType] = useState<
    "RECEIVE-FROM-COLLECT-LINK" | "SEND-TO-REQUEST-LINK"
  >("RECEIVE-FROM-COLLECT-LINK");

  const SUPPORTED_CHAINS = CHAINS as WalletChain[];

  const filter_form = useForm<FILTER_SCHEMA_TYPE>({
    resolver: zodResolver(filter_schema),
    defaultValues: {
      filterChainId: "",
    },
  });
  const FILTER_CHAIN_ID = filter_form.watch("filterChainId");

  const { data: SELECTED_CHAIN } = useChain({ id: FILTER_CHAIN_ID! });

  const filteredTokens = useCallback(() => {
    if (FILTER_CHAIN_ID == "") return ALL_TOKENS;
    else {
      return ALL_TOKENS?.filter((_tok) => _tok?.chain_id === FILTER_CHAIN_ID);
    }
  }, [FILTER_CHAIN_ID]);

  const handleCloseRedirectDrawer = useCallback(() => {
    setIsRedirectDrawerOpen(false);
  }, []);

  const checkRedirectObjects = useCallback(() => {
    const collectobjectb64 = localStorage.getItem("collectobject");
    const requestobjectb64 = localStorage.getItem("requestobject");

    if (collectobjectb64 !== null) {
      setRedirectType("RECEIVE-FROM-COLLECT-LINK");
      setIsRedirectDrawerOpen(true);
    } else if (requestobjectb64 !== null) {
      setRedirectType("SEND-TO-REQUEST-LINK");
      setIsRedirectDrawerOpen(true);
    } else {
      setIsRedirectDrawerOpen(false);
    }
  }, []);

  useEffect(() => {
    checkRedirectObjects();

    const interval = setInterval(checkRedirectObjects, 2000);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "collectobject" || e.key === "requestobject") {
        checkRedirectObjects();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    logEvent("PAGE_VISIT_HOME");
  }, []);

  return (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-full overflow-y-auto mb-18 p-4"
    >
      <div className="text-center mt-8 mb-4">
        <h1 className="text-5xl font-medium mb-2">
          {formatNumberUsd(formatFloatNumber(AGGREGATE_BALANCE ?? 0))}
        </h1>
      </div>

      <div className="w-full flex flex-row items-center justify-center gap-3">
        <SendDrawer
          {...send_disclosure}
          renderTrigger={() => (
            <ActionButton
              icon={<IoArrowUpCircle className="w-6 h-6" />}
              title="Send"
            />
          )}
        />

        <ReceiveDrawer
          {...receive_disclosure}
          renderTrigger={() => (
            <ActionButton
              icon={<IoArrowDownCircle className="w-6 h-6" />}
              title="Receive"
            />
          )}
        />

        <BuyCrypto
          renderTrigger={() => (
            <ActionButton
              icon={<FaMoneyBillTransfer className="w-6 h-6" />}
              title="Buy"
            />
          )}
        />
      </div>

      <div className="flex flex-row items-center justify-between mb-3 mt-2 w-full ">
        <div>
          {FILTER_CHAIN_ID !== "" && (
            <motion.div
              key={FILTER_CHAIN_ID}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ease: "easeInOut" }}
              className="flex flex-row items-center justify-start gap-1 "
            >
              <img
                className="w-6 h-6 rounded-full"
                src={SELECTED_CHAIN?.icon}
                alt={SELECTED_CHAIN?.description}
              />
              <p className="text-sm font-semibold">
                {SELECTED_CHAIN?.description}
              </p>
            </motion.div>
          )}
        </div>

        <Button
          onClick={() =>
            FILTER_CHAIN_ID == "" ? onOpen() : filter_form.reset()
          }
          variant="ghost"
          className="w-10 h-10 rounded-md p-3"
        >
          {FILTER_CHAIN_ID == "" ? (
            <FaFilter className="text-text-subtle text-3xl" />
          ) : (
            <MdFilterAltOff className="text-text-subtle text-3xl" />
          )}
        </Button>
      </div>

      <div className="space-y-2">
        {ALL_TOKENS_PENDING ? (
          <>
            <TokenSketleton />
            <TokenSketleton />
            <TokenSketleton />
          </>
        ) : FILTER_CHAIN_ID !== "" && filteredTokens()?.length !== 0 ? (
          filteredTokens()?.map((_token, idx) => (
            <TokenCard
              key={_token?.id + idx}
              tokenid={_token?.id}
              chain={_token?.chain_id}
            />
          ))
        ) : (
          ALL_TOKENS?.map((_token, idx) => (
            <TokenCard
              key={_token?.id + idx}
              tokenid={_token?.id}
              chain={_token?.chain_id}
            />
          ))
        )}
      </div>

      <RedirectLinks
        isOpen={isRedirectDrawerOpen}
        onClose={handleCloseRedirectDrawer}
        redirectType={redirectType}
      />

      <Drawer
        repositionInputs={false}
        modal
        open={isOpen}
        onClose={() => {
          onClose();
        }}
        onOpenChange={(open) => {
          if (open) {
            onOpen();
          } else {
            onClose();
          }
        }}
      >
        <DrawerContent className="h-[50vh]">
          <DrawerHeader className="hidden">
            <DrawerTitle>Token Filters</DrawerTitle>
            <DrawerDescription>Filter tokens by chain</DrawerDescription>
          </DrawerHeader>

          <div className="w-full h-full overflow-y-auto mt-3">
            <Controller
              control={filter_form.control}
              name="filterChainId"
              render={({ field }) => {
                return (
                  <>
                    {SUPPORTED_CHAINS?.map((_chain) => (
                      <div
                        className="w-full border-b-1 border-surface flex flex-row items-center justify-start gap-3 p-2 px-3 cursor-pointer"
                        onClick={() => {
                          field.onChange(_chain?.chain_id);
                          toggle();
                        }}
                      >
                        <img
                          className="w-10 h-10 rounded-full"
                          src={_chain?.icon}
                          alt={_chain?.name}
                        />
                        <p className="text-sm font-semibold">
                          {_chain?.description}
                        </p>
                      </div>
                    ))}
                  </>
                );
              }}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </motion.div>
  );
}
