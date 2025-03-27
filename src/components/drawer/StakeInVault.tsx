import { JSX, useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useSnackbar } from "../../hooks/snackbar";
import { useAppDrawer } from "../../hooks/drawer";
import { stakeLST } from "../../utils/api/staking";
import { fetchAirWllxBalances } from "../../utils/api/awllx";
import { OutlinedTextInput } from "../global/Inputs";
import { SubmitButton } from "../global/Buttons";
import { colors } from "../../constants";
import usdclogo from "../../assets/images/labs/usdc.png";
import airwallex from "../../assets/images/awx.png";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FaIcon } from "../../assets/faicon";
import "../../styles/components/drawer/stakeunstakeinvault.scss";

type PaymentMethodType = "usdc" | "usd" | "hkd" | "fiat";

interface PaymentOption {
  id: PaymentMethodType;
  name: string;
  icon: string;
  balance: number;
  currency: string;
  source: string;
}

export const StakeInVault = (): JSX.Element => {
  const { initData } = useLaunchParams();
  const { showerrorsnack, showsuccesssnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [showApproved, setShowApproved] = useState<boolean>(false);
  const [approved, setApproved] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("usdc");
  const [_, setInsufficientUSDC] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  const stakingintent = localStorage.getItem("stakeintent");

  // USDC balance - mocked for now
  const usdcBalance = 200;

  // Fetch Airwallex balances
  const { data: airwallexData } = useQuery({
    queryKey: ["airwallexbalances"],
    queryFn: () => fetchAirWllxBalances(initData?.user?.username as string),
  });

  // Check if user has Airwallex balance
  const hasAirwallexAccount = airwallexData?.status !== 404;
  const airwallexUsdBalance = hasAirwallexAccount
    ? airwallexData?.balances?.balances?.USD || 0
    : 0;
  const airwallexHkdBalance = hasAirwallexAccount
    ? airwallexData?.balances?.balances?.HKD || 0
    : 0;

  const paymentOptions: PaymentOption[] = [
    {
      id: "usdc",
      name: "USDC",
      icon: usdclogo,
      balance: usdcBalance,
      currency: "USDC",
      source: "Wallet",
    },
    {
      id: "usd",
      name: "Airwallex USD",
      icon: airwallex,
      balance: airwallexUsdBalance,
      currency: "USD",
      source: "Airwallex",
    },
    {
      id: "hkd",
      name: "Airwallex HKD",
      icon: airwallex,
      balance: airwallexHkdBalance,
      currency: "HKD",
      source: "Airwallex",
    },
    {
      id: "fiat",
      name: "Airwallex USD",
      icon: airwallex,
      balance: 0,
      currency: "",
      source: "Bank",
    },
  ];

  // Current selected payment option
  const selectedOption =
    paymentOptions.find((option) => option.id === paymentMethod) ||
    paymentOptions[0];

  // Check if selected payment method balance is sufficient
  useEffect(() => {
    if (
      paymentMethod === "usdc" &&
      stakeAmount &&
      Number(stakeAmount) > usdcBalance
    ) {
      setInsufficientUSDC(true);
    } else {
      setInsufficientUSDC(false);
    }
  }, [stakeAmount, usdcBalance, paymentMethod]);

  const onApprove = () => {
    setTimeout(() => {
      showsuccesssnack("Approved successfully, proceed to Staking");
      setApproved(true);
    }, 3500);
  };

  const { mutate: onSubmitStake, isPending } = useMutation({
    mutationFn: () =>
      stakeLST(Number(stakeAmount), stakingintent == null ? "stake" : "unlock")
        .then(() => {
          localStorage.removeItem("stakeintent");
          setStakeAmount("");
          showsuccesssnack(`Successfully staked ${stakeAmount} USDC`);
          closeAppDrawer();
        })
        .catch(() => {
          showerrorsnack("Failed to stake, please try again");
        }),
  });

  const { mutate: onSubmitStakeWithAirwallex, isPending: isAirwallexPending } =
    useMutation({
      mutationFn: () => {
        // Mock API call for Airwallex staking
        return new Promise<void>((resolve, reject) => {
          setTimeout(() => {
            const currentBalance =
              paymentMethod === "usd"
                ? airwallexUsdBalance
                : airwallexHkdBalance;

            if (Number(stakeAmount) <= currentBalance) {
              resolve();
            } else {
              reject(
                new Error(`Insufficient ${paymentMethod.toUpperCase()} balance`)
              );
            }
          }, 2000);
        })
          .then(() => {
            setStakeAmount("");
            showsuccesssnack(
              `Successfully staked ${stakeAmount} ${paymentMethod.toUpperCase()} from Airwallex`
            );
            closeAppDrawer();
          })
          .catch((error) => {
            showerrorsnack(
              error.message ||
                "Failed to stake from Airwallex, please try again"
            );
          });
      },
    });

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const selectPaymentMethod = (method: PaymentMethodType) => {
    setPaymentMethod(method);
    setDropdownOpen(false);

    // Reset approval state when changing payment method
    if (method !== "usdc") {
      setShowApproved(false);
      setApproved(false);
    }
  };

  const getMaxAmount = () => {
    switch (paymentMethod) {
      case "usdc":
        return usdcBalance.toString();
      case "usd":
        return airwallexUsdBalance.toString();
      case "hkd":
        return airwallexHkdBalance.toString();
      default:
        return "0";
    }
  };

  const isBalanceInsufficient = () => {
    if (stakeAmount === "") return false;

    switch (paymentMethod) {
      case "usdc":
        return Number(stakeAmount) > usdcBalance;
      case "usd":
        return Number(stakeAmount) > airwallexUsdBalance;
      case "hkd":
        return Number(stakeAmount) > airwallexHkdBalance;
      case "fiat":
        return false;
      default:
        return false;
    }
  };

  const getSubmitButton = () => {
    if (paymentMethod === "usdc") {
      return (
        <SubmitButton
          text={approved ? "Stake USDC" : "Approve"}
          sxstyles={{
            marginTop: "1rem",
            padding: "0.625rem",
            backgroundColor:
              stakeAmount === "" || isPending || isBalanceInsufficient()
                ? colors.divider
                : colors.success,
          }}
          isDisabled={
            stakeAmount === "" || isPending || isBalanceInsufficient()
          }
          isLoading={isPending}
          onclick={
            approved
              ? onSubmitStake
              : showApproved
              ? onApprove
              : () => setShowApproved(true)
          }
        />
      );
    } else if (paymentMethod === "usd" || paymentMethod === "hkd") {
      return (
        <SubmitButton
          text={`Stake with Airwallex ${paymentMethod.toUpperCase()}`}
          sxstyles={{
            marginTop: "1rem",
            padding: "0.625rem",
            backgroundColor:
              stakeAmount === "" ||
              isAirwallexPending ||
              isBalanceInsufficient()
                ? colors.divider
                : colors.accent,
          }}
          isDisabled={
            stakeAmount === "" || isAirwallexPending || isBalanceInsufficient()
          }
          isLoading={isAirwallexPending}
          onclick={onSubmitStakeWithAirwallex}
        />
      );
    } else {
      return (
        <SubmitButton
          text="Continue with Bank Transfer"
          sxstyles={{
            marginTop: "1rem",
            padding: "0.625rem",
            backgroundColor:
              stakeAmount === "" ? colors.divider : colors.textprimary,
          }}
          isDisabled={stakeAmount === ""}
          isLoading={false}
          onclick={() => {
            showsuccesssnack("Bank transfer request initiated");
            closeAppDrawer();
          }}
        />
      );
    }
  };

  return (
    <div className="stakeinvault">
      <div className="payment-method-selector">
        <p className="selector-label">Payment Method</p>

        <div className="dropdown-container">
          <button className="dropdown-header" onClick={toggleDropdown}>
            <div className="selected-option">
              <div className="option-icon">
                <img src={selectedOption.icon} alt={selectedOption.name} />
              </div>
              <div className="option-details">
                <span className="option-name">{selectedOption.name}</span>
                {selectedOption.id !== "fiat" && (
                  <span className="option-balance">
                    {selectedOption.balance.toFixed(2)}{" "}
                    {selectedOption.currency}
                  </span>
                )}
              </div>
            </div>
            <FaIcon
              faIcon={dropdownOpen ? faChevronUp : faChevronDown}
              fontsize={14}
              color={colors.textprimary}
            />
          </button>

          {dropdownOpen && (
            <div className="dropdown-options">
              {paymentOptions.map((option) =>
                !hasAirwallexAccount &&
                (option.id === "usd" || option.id === "hkd") ? null : (
                  <button
                    key={option.id}
                    className={`dropdown-option ${
                      paymentMethod === option.id ? "active" : ""
                    }`}
                    onClick={() => selectPaymentMethod(option.id)}
                  >
                    <div className="option-icon">
                      <img src={option.icon} alt={option.name} />
                    </div>
                    <div className="option-details">
                      <span className="option-name">{option.name}</span>
                      {option.id !== "fiat" && (
                        <span className="option-balance">
                          {option.balance.toFixed(2)} {option.currency}
                        </span>
                      )}
                      <span className="option-source">{option.source}</span>
                    </div>
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <div className="divider"></div>

      <div className="token">
        <p>Token</p>
        <img
          src={paymentMethod === "usdc" ? usdclogo : airwallex}
          alt={paymentMethod === "usdc" ? "USDC" : "Airwallex"}
        />
      </div>

      <OutlinedTextInput
        inputType="text"
        inputlabalel="Stake Amount"
        placeholder="100"
        inputState={stakeAmount}
        setInputState={setStakeAmount}
        sxstyles={{ marginTop: "0.75rem" }}
      />

      {paymentMethod !== "fiat" && (
        <div className="balance">
          <p>
            Balance <br />
            <span>
              {selectedOption.balance.toFixed(2)} {selectedOption.currency}
            </span>
          </p>

          <button
            className="max_out"
            onClick={() => setStakeAmount(getMaxAmount())}
          >
            Max
          </button>
        </div>
      )}

      <p className="receive">
        You'll receive
        <span>{stakeAmount === "" ? 0 : stakeAmount} LST</span>
      </p>

      {paymentMethod === "usdc" && showApproved && (
        <div className="approval">
          <p className="msg">
            Approve USDC Token
            <span>
              You need to approve the contract to spend your USDC tokens.
            </span>
          </p>

          <p className="gas">
            <span>Estimated Gas Fee</span> ~0.001 ETH
          </p>
        </div>
      )}

      {(paymentMethod === "usd" || paymentMethod === "hkd") && (
        <div className="airwallex-info">
          <p className="msg">
            Stake with Airwallex {paymentMethod.toUpperCase()}
            <span>Funds will be withdrawn from your Airwallex account</span>
          </p>

          {isBalanceInsufficient() && (
            <p className="airwallex-warning">
              Insufficient {paymentMethod.toUpperCase()} balance
            </p>
          )}
        </div>
      )}

      {paymentMethod === "fiat" && (
        <div className="fiat-info">
          <p className="msg">
            Stake via Bank Transfer
            <span>You'll be guided through the bank transfer process</span>
          </p>
          <p className="note">Note: Processing may take 1-3 business days</p>
        </div>
      )}

      {getSubmitButton()}
    </div>
  );
};
