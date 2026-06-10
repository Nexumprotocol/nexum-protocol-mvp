# NEXUM Protocol

> Decentralized micro-task marketplace on Solana — connecting Southeast Asian contributors with Web3 projects via trustless escrow and on-chain reputation.

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Network: Devnet](https://img.shields.io/badge/Network-Solana%20Devnet-green.svg)](https://explorer.solana.com/address/7yn8tuqHbNFRojEgiWeSoJkYjYtmdh1w4dKA2bCgNNzA?cluster=devnet)
[![Status: Live](https://img.shields.io/badge/Status-Live%20on%20Devnet-brightgreen.svg)]()

---

## 🔗 Links

| | |
|---|---|
| 🌐 Landing Page | https://nexum-protocol.netlify.app |
| 🚀 Live Demo | https://7860d997-602d-4d49-af73-e8c0e641765d-00-27y6dsdm1nrp0.sisko.replit.dev |
| 🔍 Program on Explorer | https://explorer.solana.com/address/7yn8tuqHbNFRojEgiWeSoJkYjYtmdh1w4dKA2bCgNNzA?cluster=devnet |
| 🐦 Twitter | https://twitter.com/nexum_p |
| 📧 Contact | protocolnexum@gmail.com |

---

## 📋 Overview

NEXUM Protocol solves a critical problem in Web3: **there is no trustless, low-cost way for Southeast Asian contributors to get paid for their work by global Web3 projects.**

Traditional platforms charge 20%+ fees, take days to process payments, and offer no on-chain reputation. NEXUM changes this with:

- **Trustless escrow** — SOL locked on-chain, released only on completion
- **2.5% platform fee** vs 20%+ on Web2 platforms
- **SBT reputation** — non-transferable, soulbound proof of work history
- **Sub-second finality** on Solana at $0.00025/tx

---

## 🏗️ Architecture

```
Creator posts task → SOL locked in escrow PDA
        ↓
Worker applies → task status: InProgress
        ↓
Creator approves → worker paid (net 2.5% fee)
        ↓
Worker reputation++ → SBT level updates
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full system design.

---

## ⚡ Smart Contract

**Program ID:** `7yn8tuqHbNFRojEgiWeSoJkYjYtmdh1w4dKA2bCgNNzA`
**Network:** Solana Devnet
**Framework:** Anchor 0.31.0

### Instructions

| Instruction | Description |
|-------------|-------------|
| `create_profile` | Register on-chain profile with username + skills |
| `create_task` | Post task + lock SOL reward into escrow PDA |
| `apply_task` | Worker claims an open task |
| `complete_task` | Creator approves → worker receives payout |
| `open_dispute` | Either party raises a dispute |
| `resolve_dispute` | Resolver (DAO in production) decides outcome |

### SBT Reputation Levels

| Level | Title | Tasks Required |
|-------|-------|---------------|
| 0 | Newcomer | 0 |
| 1 | Contributor | 5 |
| 2 | Builder | 15 |
| 3 | Expert | 30 |
| 4 | Legend | 50 |

---

## 🖥️ Frontend

- **Framework:** Vite + React + TypeScript
- **Wallet:** Phantom / Solflare via wallet-adapter
- **On-chain fetch:** Auto-detects live tasks, falls back to mock data
- **Status badge:** ○ Demo → ● Live once first task is created

---

## 🚀 Quick Start

### Prerequisites
- Rust + Cargo
- Solana CLI 1.18+
- Anchor CLI 0.31.0
- Node.js 18+
- Phantom wallet (Devnet)

### Build & Test
```bash
# Clone repo
git clone https://github.com/fariztiger/nexum-protocol-mvp
cd nexum-protocol-mvp

# Install dependencies
npm install

# Build smart contract
anchor build

# Run tests
anchor test

# Start frontend
cd app && npm install && npm run dev
```

### Deploy to Devnet
```bash
solana config set --url devnet
solana airdrop 2
anchor deploy --provider.cluster devnet
```

---

## 🪙 Tokenomics

**NXM Token** — 100M fixed supply

| Allocation | % | Amount |
|-----------|---|--------|
| Community & Grants | 35% | 35M NXM |
| Ecosystem Fund | 25% | 25M NXM |
| Core Team (2yr vest) | 15% | 15M NXM |
| Treasury / DAO | 15% | 15M NXM |
| Early Contributors | 10% | 10M NXM |

See [docs/TOKENOMICS.md](docs/TOKENOMICS.md) for full details.

---

## 🗺️ Roadmap

**Q3 2025 — MVP** ✅
- Smart contract deployed on Devnet
- Web app with Phantom wallet integration
- Task creation, escrow, completion flow

**Q4 2025 — Beta**
- NXM token launch
- DAO dispute resolution
- Mobile app (Expo)
- Mainnet deployment

**Q1 2026 — Growth**
- 100+ active contributors
- SDK for third-party integrations
- Multi-token payments (USDC, NXM)

---

## 🤝 Contributing

We welcome contributions from the SEA Web3 community! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 🔒 Security

Found a vulnerability? See [SECURITY.md](SECURITY.md) for responsible disclosure.

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

*Built for [Superteam SEA Microgrant](https://earn.superteam.fun/grants/) · Powered by Solana*
