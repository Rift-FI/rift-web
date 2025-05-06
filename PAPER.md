## Sphere Lightpaper: Unifying Web3 & Web2 with Proof-of-Utility

**Version:** 0.2
**Date:** October 26, 2023

**(Disclaimer: This document is for informational purposes only and does not constitute investment advice, a prospectus, or an offer to sell.)**

### 1. Abstract

Sphere is a next-generation wallet and asset management platform, built as a protocol on established blockchain infrastructure (e.g., Ethereum Layer 2) and delivered through an accessible Telegram Mini App. It's designed to eliminate the complexities of Web3 and unlock dormant value in Web2 assets. Leveraging Account Abstraction (AA) and Shamir Secret Sharing (SSS) for key management, Sphere offers a seamless, secure, seedless experience for managing multi-chain crypto assets. Its core innovation lies in a secure marketplace for lending access to verified Web2 secrets (like API keys), powered by a novel dual-token economic model, **Proof-of-Utility**, inspired by Berachain, ensuring the integrity and reliability of these off-chain assets within the Sphere ecosystem.

### 2. The Problem: Fragmentation and Friction

The digital asset landscape is fragmented and often intimidating:

- **Web3 Complexity:** Users juggle multiple wallets, chains, seed phrases, and confusing gas fees, hindering adoption.
- **Web2 Silos:** Valuable digital assets like API keys (OpenAI, Airwallex, etc.) or platform accounts (Polymarket) sit isolated, generating no value beyond their primary function.
- **Security Burdens:** Managing private keys securely is a significant challenge for most users.
- **Lack of Interoperability:** Bridging value and utility between Web2 services and Web3 protocols is cumbersome and risky.

### 3. The Sphere Solution: Unified, Secure, Simple on Secure Foundations

Sphere addresses these challenges by building its innovative features on top of secure and scalable blockchain networks:

- **Account Abstraction (AA) Wallet:** A smart contract wallet simplifying interactions (batch transactions, gas sponsorship potential) deployed on a robust L1/L2 network and accessed via a user-friendly Telegram Mini App.
- **Shamir Secret Sharing (SSS) Key Management:** User keys are split into shards and distributed via a decentralized network, eliminating single points of failure and the need for users to manage seed phrases directly. Enables robust social recovery mechanisms.
- **Unified Multi-Chain Dashboard:** Manage crypto assets across various blockchains from a single interface, leveraging cross-chain communication protocols.
- **Secure Web2 Secret Vault:** Import and securely store valuable Web2 API keys and secrets using SSS protection, with proofs anchored on-chain.
- **Web2 Asset Utility Marketplace:** Lend out _permissioned access_ to your verified Web2 assets (e.g., allow someone to use your OpenAI key via a controlled Sphere interface without giving them the key itself), facilitated by smart contracts.
- **Validity Engine:** An internal, off-chain mechanism constantly verifying the status of registered Web2 assets on their native platforms, with results potentially attested on-chain periodically.
- **High-Yield Staking Vaults:** Earn passive income (targeting 11-13% APY) through professionally managed DeFi strategies integrated within the Sphere platform.
- **Simplified Payments:** Features like "Click-to-Collect" links utilize smart contracts to streamline crypto transfers.

### 4. Introducing Proof-of-Utility: A Novel Dual-Token Economy

The cornerstone of Sphere's Web2 integration is its tokenomic model, designed to incentivize the health and reliability of the Web2 asset lending market. Inspired by Berachain's BERA/BGT system, Sphere utilizes two tokens within its protocol:

**a) `$SPHERE` (Sphere Token):**

- **Type:** ERC-20 (or equivalent standard) liquid, transferable utility and governance participation token.
- **Utility:**
  - Used for specific protocol fees within the Sphere ecosystem (e.g., marketplace transaction fees, vault performance fees). May potentially subsidize network gas fees for certain actions.
  - Primary asset for staking to earn `$sPWR` and participate in securing protocol functions tied to staking.
  - Potentially used for accessing premium features or services.
- **Acquisition:** Can be acquired through DEXs, CEXs, airdrops, or potentially earned via specific platform activities.

**b) `$sPWR` (Sphere Power):**

- **Type:** Non-transferable (or Soulbound Token - SBT) reward and governance token. Represents influence and verified contribution within the Sphere ecosystem.
- **Earning `$sPWR` (Proof-of-Utility):** Users earn `$sPWR` by performing actions vital to the protocol's health and utility:
  - **Providing Validated Web2 Assets:** Listing API keys/secrets that pass Sphere's Validity Engine checks is the primary way to earn `$sPWR`. This directly rewards users for bringing verifiable, functional off-chain utility into the ecosystem. The amount earned can be weighted by the asset's demand or type.
  - **Staking `$SPHERE`:** Users staking `$SPHERE` tokens earn a baseline emission of `$sPWR`.
  - **Successful Web2 Lending:** Lenders whose keys remain valid throughout a lending period may receive bonus `$sPWR`.
  - **Participating in Sphere Staking Vaults:** Contributing assets to the yield strategies earns `$sPWR`.
- **Utility of `$sPWR`:**
  - **Governance:** Used to vote on key protocol decisions delegated by the core team or future DAO (e.g., supported assets, fee changes, `$sPWR` emission parameters, grant allocations).
  - **Directing Incentives:** `$sPWR` holders can vote to direct future `$SPHERE` or `$sPWR` emissions towards specific Web2 asset types or staking vaults, boosting rewards for high-demand areas.
  - **Web2 Lender Accountability (Slashing):** To list a Web2 asset for lending, owners must implicitly or explicitly back it with their ability to earn/hold `$sPWR` (likely via required underlying `$SPHERE` stake). If the Validity Engine detects a lender maliciously invalidated their key _during_ an active lending period, a portion of their associated `$SPHERE` stake (signaled by `$sPWR` holdings or specific staking contracts) can be slashed via smart contract logic. Slashed funds could potentially compensate the affected borrower.
  - **Potential Future Utility:** Mechanisms might allow using `$sPWR` for enhanced platform benefits or exclusive access.

### 5. The Synergistic Flywheel

This dual-token system creates a powerful flywheel within the Sphere protocol:

1.  Users bring Web2 assets -> Earn `$sPWR` -> Increases incentive to keep assets valid.
2.  Valid assets -> Healthy Lending Market -> Attracts Borrowers -> Generates protocol fees (potentially in `$SPHERE`).
3.  Fees & Utility -> Demand for `$SPHERE` -> Value accrual for `$SPHERE`.
4.  Staking `$SPHERE` -> Earn `$sPWR` -> Participate in governance & security.
5.  `$sPWR` Governance -> Directs incentives -> Optimizes market & rewards -> Attracts more assets/users.
6.  Slashing mechanism -> Protects borrowers -> Builds trust -> Increases market participation.

This model directly connects the value and utility of off-chain Web2 assets to the on-chain token economy, ensuring alignment and rewarding participation that strengthens the entire ecosystem, all while leveraging the security and composability of existing blockchain infrastructure.

### 6. Conclusion

Sphere aims to be more than just a wallet; it's a unified protocol bridging the gap between Web3 convenience and Web2 utility. By combining user-friendly AA/SSS infrastructure with an innovative Proof-of-Utility tokenomic model focused on validating and incentivizing real-world digital assets, Sphere is uniquely positioned to unlock new forms of value creation and drive broader adoption of decentralized technologies, contributing valuable functionality to the broader blockchain ecosystem it resides within.

---

**(End of Lightpaper Draft)**
