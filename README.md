# NEXUM Protocol — MVP

Decentralized micro-task marketplace on Solana — connecting SEA contributors with Web3 projects via trustless escrow.

## Architecture

```
nexum-mvp/
├── programs/nexum/src/lib.rs   ← Anchor smart contract (all logic)
├── tests/nexum.ts              ← TypeScript test suite
├── Anchor.toml                 ← Anchor config (devnet)
├── app/                        ← Next.js frontend
│   └── src/
│       ├── app/page.tsx        ← Task board main page
│       ├── components/
│       │   ├── TaskCard.tsx    ← Individual task card
│       │   ├── CreateTaskModal.tsx ← Post task flow
│       │   ├── ProfilePanel.tsx    ← Wallet profile + SBT
│       │   └── WalletProvider.tsx  ← Phantom/Solflare adapter
│       └── types/index.ts      ← Shared TypeScript types
```

## Smart Contract Features

| Feature | Instruction | Description |
|---------|------------|-------------|
| ✅ User Profile | `create_profile` | On-chain profile with username, skills |
| ✅ Create Task | `create_task` | Post task + lock SOL in escrow PDA |
| ✅ Apply | `apply_task` | Worker claims open task |
| ✅ Complete | `complete_task` | Creator approves → worker gets paid (net 2.5% fee) |
| ✅ Dispute | `open_dispute` | Either party opens dispute |
| ✅ Resolve | `resolve_dispute` | Resolver (DAO in prod) decides outcome |
| ✅ SBT Levels | auto | Reputation levels: 0→4 based on completed tasks |

## Setup

### Prerequisites
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install 0.31.0
avm use 0.31.0

# Install Node.js deps
npm install
```

### Build & Test (Smart Contract)
```bash
# Configure for devnet
solana config set --url devnet

# Create wallet (if new)
solana-keygen new

# Get devnet SOL
solana airdrop 2

# Build program
anchor build

# Run tests
anchor test
```

### Frontend
```bash
cd app
npm install
npm run dev
# → http://localhost:3000
```

### Deploy to Devnet
```bash
# Build
anchor build

# Deploy
anchor deploy --provider.cluster devnet

# Update program ID in:
# 1. programs/nexum/src/lib.rs → declare_id!(...)
# 2. Anchor.toml → [programs.devnet]
# 3. app/src/app/page.tsx → PROGRAM_ID
```

## SBT Reputation System

| Level | Title | Tasks Required |
|-------|-------|----------------|
| 0 | Newcomer | 0 |
| 1 | Contributor | 5 |
| 2 | Builder | 15 |
| 3 | Expert | 30 |
| 4 | Legend | 50 |

Each completed task grants +10 reputation points. Dispute wins grant +5.

## TODO: Production Upgrades

- [ ] Replace resolver with DAO staker vote (token-weighted)
- [ ] Add NXM token payments alongside SOL
- [ ] SBT minting via Token-2022 (non-transferable)
- [ ] Treasury PDA for fee accumulation
- [ ] Multi-sig for admin functions
- [ ] IPFS for task metadata (descriptions > 500 chars)
- [ ] Indexer (Helius webhooks) for real-time task updates
- [ ] Rate limiting: max tasks per wallet per epoch

## Security Notes (MVP)

⚠️ `resolve_dispute` uses upgrade authority as resolver — replace before mainnet  
⚠️ Escrow fee accumulates in PDA — add treasury sweep instruction  
⚠️ No cooldown on `apply_task` — one worker per task only (enforced by status check)  
⚠️ `task_id` is user-supplied — validate uniqueness off-chain or use PDA nonce counter

## Contact

- Twitter: [@nexum_p](https://twitter.com/nexum_p)
- Email: protocolnexum@gmail.com
- Grant: [Superteam SEA Microgrant](https://earn.superteam.fun/grants/)
