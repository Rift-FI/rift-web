import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  faChevronLeft,
  faArrowRight,
  faInfoCircle,
  faLock,
  faMoneyBillWave,
  faCalendarDay,
  faCheckCircle,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { useBackButton } from "../hooks/backbutton";
import { FaIcon } from "../assets/faicon";
import { getStakingInfo, getStakeingBalance } from "../utils/api/staking";
import { formatUsdSimple } from "../utils/formatters";
import { Loading } from "../assets/animations";
import { SubmitButton } from "../components/global/Buttons";
import { techgrityProducts } from "../components/tabs/Defi";
import { colors } from "../constants";
import "../styles/pages/vaultdetails.scss";

const VaultDetails = () => {
  const { vaultId } = useParams<{ vaultId: string }>();
  const navigate = useNavigate();
  const [showExtraInfo, setShowExtraInfo] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "1m" | "6m" | "1y"
  >("1y");

  const goBack = () => {
    navigate(-1);
  };

  // Fetch staking info
  const { isFetching: stakingInfoLoading } = useQuery({
    queryKey: ["stakinginfo"],
    queryFn: getStakingInfo,
  });

  // Fetch staking balance
  const { data: stakingBalance, isFetching: stakingBalanceLoading } = useQuery({
    queryKey: ["stakingbalance"],
    queryFn: getStakeingBalance,
  });

  // Get vault details based on vaultId
  const vault =
    techgrityProducts.find((product) => product.id === vaultId) ||
    techgrityProducts[0];

  // Mock data for APY chart
  const apyChartData = {
    "1m": vault.apyHistory?.slice(-1) || Array(1).fill(11),
    "6m": vault.apyHistory?.slice(-6) || Array(6).fill(11),
    "1y": vault.apyHistory || Array(12).fill(11),
  };

  // Mock supported assets
  const supportedAssets = ["USDC", "USDT", "DAI", "BUSD", "WUSD"];

  // Mock user balance
  const userBalance = stakingBalance?.data?.lstBalance || 5000;
  const userLSTBalance = stakingBalance?.data?.lstBalance || 5250;

  const isLoading = stakingInfoLoading || stakingBalanceLoading;

  useBackButton(goBack);

  return (
    <div className="vault-details-page">
      <div className="vault-details-header">
        <button className="back-button" onClick={goBack}>
          <FaIcon
            faIcon={faChevronLeft}
            fontsize={16}
            color={colors.textprimary}
          />
        </button>
        <h1>{vault.name}</h1>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <Loading width="2.5rem" height="2.5rem" />
        </div>
      ) : (
        <>
          <div className="vault-summary-card">
            <div className="guaranteed-badge">
              <FaIcon
                faIcon={faCheckCircle}
                fontsize={14}
                color={colors.success}
              />
              <span>Guaranteed Return</span>
            </div>

            <div className="apy-section">
              <div className="apy-value">
                <span className="label">Annual Yield</span>
                <span className="value">11%</span>
                <span className="guarantee-text">
                  Fixed Rate • No Fluctuation
                </span>
              </div>
              <div className="apy-description">
                <p>
                  The Buffet Vault offers a stable and guaranteed 11% APY,
                  regardless of market conditions. Your capital is secure and
                  earnings are predictable.
                </p>
              </div>
            </div>

            <div className="vault-stats">
              <div className="stat-item">
                <FaIcon
                  faIcon={faMoneyBillWave}
                  fontsize={14}
                  color={colors.accent}
                />
                <div className="stat-content">
                  <span className="stat-label">Current TVL</span>
                  <span className="stat-value">{vault.currentTvl}</span>
                </div>
              </div>

              <div className="stat-item">
                <FaIcon faIcon={faLock} fontsize={14} color={colors.accent} />
                <div className="stat-content">
                  <span className="stat-label">Lock Period</span>
                  <span className="stat-value">{vault.lockPeriod}</span>
                </div>
              </div>

              <div className="stat-item">
                <FaIcon
                  faIcon={faCalendarDay}
                  fontsize={14}
                  color={colors.accent}
                />
                <div className="stat-content">
                  <span className="stat-label">Min. Deposit</span>
                  <span className="stat-value">${vault.minDeposit}</span>
                </div>
              </div>
            </div>

            <div className="tvl-progress">
              <div className="progress-header">
                <span>Capacity</span>
                <span>
                  {(
                    (parseInt(vault.currentTvl.replace(/[^0-9]/g, "")) /
                      parseInt(vault.maxCapacity.replace(/[^0-9]/g, ""))) *
                    100
                  ).toFixed(1)}
                  % Full
                </span>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${
                      (parseInt(vault.currentTvl.replace(/[^0-9]/g, "")) /
                        parseInt(vault.maxCapacity.replace(/[^0-9]/g, ""))) *
                      100
                    }%`,
                  }}
                />
              </div>
              <div className="progress-values">
                <span>$0</span>
                <span>{vault.maxCapacity}</span>
              </div>
            </div>
          </div>

          <div className="user-position-card">
            <h2>Your Position</h2>

            <div className="position-details">
              <div className="position-item">
                <span className="label">Deposited</span>
                <span className="value">
                  ${formatUsdSimple(Number(userBalance))}
                </span>
              </div>

              <div className="position-item">
                <span className="label">Earned LST</span>
                <span className="value">
                  $
                  {formatUsdSimple(
                    Number(userLSTBalance) - Number(userBalance)
                  )}
                </span>
              </div>

              <div className="position-item total">
                <span className="label">Total Value</span>
                <span className="value">
                  ${formatUsdSimple(Number(userLSTBalance))}
                </span>
              </div>
            </div>

            <div className="action-buttons">
              <SubmitButton
                text="Deposit"
                icon={
                  <FaIcon
                    faIcon={faArrowRight}
                    fontsize={14}
                    color={colors.primary}
                  />
                }
                onclick={() => {}}
                // onclick={() => navigate("/deposit/buffet")}
                sxstyles={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  fontSize: "1rem",
                }}
              />

              <button
                className="withdraw-button"
                // onClick={() => navigate("/withdraw/buffet")}
              >
                Withdraw
              </button>
            </div>
          </div>

          <div className="vault-info-card">
            <div
              className="info-header"
              onClick={() => setShowExtraInfo(!showExtraInfo)}
            >
              <div className="header-title">
                <FaIcon
                  faIcon={faInfoCircle}
                  fontsize={16}
                  color={colors.accent}
                />
                <h2>Vault Information</h2>
              </div>
              <FaIcon
                faIcon={showExtraInfo ? faChevronUp : faChevronDown}
                fontsize={14}
                color={colors.textprimary}
              />
            </div>

            {showExtraInfo && (
              <div className="extra-info">
                <div className="info-section">
                  <h3>About This Vault</h3>
                  <p>
                    The Buffet Vault is our premier staking product offering a
                    guaranteed 11% annual return. Unlike other staking products
                    with variable returns, this vault provides stability and
                    predictable earnings regardless of market conditions.
                  </p>
                </div>

                <div className="info-section">
                  <h3>Supported Assets</h3>
                  <div className="supported-assets-list">
                    {supportedAssets.map((asset) => (
                      <div key={asset} className="asset-badge">
                        {asset}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="info-section">
                  <h3>APY History</h3>
                  <div className="chart-timeframe-selector">
                    <button
                      className={selectedTimeframe === "1m" ? "active" : ""}
                      onClick={() => setSelectedTimeframe("1m")}
                    >
                      1M
                    </button>
                    <button
                      className={selectedTimeframe === "6m" ? "active" : ""}
                      onClick={() => setSelectedTimeframe("6m")}
                    >
                      6M
                    </button>
                    <button
                      className={selectedTimeframe === "1y" ? "active" : ""}
                      onClick={() => setSelectedTimeframe("1y")}
                    >
                      1Y
                    </button>
                  </div>

                  <div className="apy-chart">
                    <div className="chart-placeholder">
                      <div className="chart-bars">
                        {apyChartData[selectedTimeframe].map((value, index) => (
                          <div
                            key={index}
                            className="chart-bar"
                            style={{ height: `${(value / 12) * 100}%` }}
                          >
                            <span className="bar-value">{value}%</span>
                          </div>
                        ))}
                      </div>
                      <div className="chart-baseline"></div>
                      <div className="month-labels">
                        {selectedTimeframe === "1m" && <span>Last Month</span>}
                        {selectedTimeframe === "6m" && (
                          <>
                            <span>6M ago</span>
                            <span>3M ago</span>
                            <span>Now</span>
                          </>
                        )}
                        {selectedTimeframe === "1y" && (
                          <>
                            <span>Jan</span>
                            <span>Apr</span>
                            <span>Jul</span>
                            <span>Oct</span>
                            <span>Now</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="chart-note">
                      <FaIcon
                        faIcon={faInfoCircle}
                        fontsize={12}
                        color={colors.accent}
                      />
                      <span>
                        The APY has remained stable at 11% throughout the
                        vault's history.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="info-section risks">
                  <h3>Risk Assessment</h3>
                  <div className="risk-item low">
                    <div className="risk-header">
                      <FaIcon
                        faIcon={faCheckCircle}
                        fontsize={14}
                        color={colors.success}
                      />
                      <span>Low Risk</span>
                    </div>
                    <p>
                      The guaranteed 11% return is backed by our treasury and
                      diversified investment portfolio, ensuring stability even
                      in volatile markets.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VaultDetails;
