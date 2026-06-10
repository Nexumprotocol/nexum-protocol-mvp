# Deployment Guide

## Live Deployment

| | |
|---|---|
| **Program ID** | `7yn8tuqHbNFRojEgiWeSoJkYjYtmdh1w4dKA2bCgNNzA` |
| **Network** | Solana Devnet |
| **Explorer** | [View on Solana Explorer](https://explorer.solana.com/address/7yn8tuqHbNFRojEgiWeSoJkYjYtmdh1w4dKA2bCgNNzA?cluster=devnet) |
| **RPC** | `https://api.devnet.solana.com` |
| **Web App** | https://7860d997-602d-4d49-af73-e8c0e641765d-00-27y6dsdm1nrp0.sisko.replit.dev |
| **Landing Page** | https://nexum-protocol.netlify.app |

---

## Deploy from Scratch

### 1. Setup
```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install 0.31.0 && avm use 0.31.0

# Configure devnet
solana config set --url devnet
solana-keygen new
solana airdrop 2
```

### 2. Build
```bash
anchor build
```

### 3. Get Program ID
```bash
anchor keys list
# Update declare_id!() in programs/nexum/src/lib.rs
# Update Anchor.toml [programs.devnet]
# Update PROGRAM_ID in app/src/lib/solana.ts
```

### 4. Deploy
```bash
anchor deploy --provider.cluster devnet
```

### 5. Verify
```bash
solana program show 7yn8tuqHbNFRojEgiWeSoJkYjYtmdh1w4dKA2bCgNNzA --url devnet
```

---

## Frontend Deploy (Netlify)

```bash
cd app
npm run build
# Drag & drop dist/ folder to netlify.com
```

---

## Mainnet Checklist (Pre-launch)

- [ ] Security audit completed
- [ ] Replace resolver with DAO multisig
- [ ] Treasury PDA sweep instruction added
- [ ] NXM token deployed (Token-2022)
- [ ] Rate limiting implemented
- [ ] Bug bounty program live
- [ ] Multisig upgrade authority
