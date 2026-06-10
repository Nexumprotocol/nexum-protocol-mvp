# NEXUM Protocol — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                   NEXUM Protocol                     │
├─────────────────┬───────────────────────────────────┤
│   Frontend      │         Solana Devnet              │
│  (Vite/React)   │                                    │
│                 │  ┌──────────┐  ┌───────────────┐  │
│  Task Board     │  │   Task   │  │    Escrow     │  │
│  Wallet Connect │──│   PDA    │  │    PDA        │  │
│  Post Task      │  │          │  │  (SOL locked) │  │
│  Apply Task     │  └──────────┘  └───────────────┘  │
│  Dispute        │                                    │
│                 │  ┌──────────┐  ┌───────────────┐  │
│                 │  │  Profile │  │   Dispute     │  │
│                 │  │   PDA    │  │     PDA       │  │
│                 │  │(SBT/Rep) │  │               │  │
│                 │  └──────────┘  └───────────────┘  │
└─────────────────┴───────────────────────────────────┘
```

## Account Structure

### Task PDA
```
seeds: ["task", task_id.to_le_bytes()]

Fields:
- task_id: u64
- creator: Pubkey
- title: String (max 80)
- description: String (max 500)
- required_skills: String (max 200)
- reward_lamports: u64
- deadline_unix: i64
- status: TaskStatus (Open/InProgress/Completed/Disputed/Cancelled)
- worker: Option<Pubkey>
```

### Escrow PDA
```
seeds: ["escrow", task_id.to_le_bytes()]

Native SOL account — no data, holds lamports only.
Released to worker on complete_task or resolve_dispute.
```

### UserProfile PDA
```
seeds: ["profile", owner_pubkey]

Fields:
- owner: Pubkey
- username: String (max 32)
- skills: String (max 200)
- reputation: u64 (+10 per task, +5 per dispute win)
- tasks_completed: u64
- tasks_created: u64
- sbt_level: u8 (0-4, auto-updated)
```

### Dispute PDA
```
seeds: ["dispute", task_id.to_le_bytes()]

Fields:
- task_id: u64
- opened_by: Pubkey
- reason: String (max 300)
- resolved: bool
```

## Task Lifecycle

```
Open ──→ InProgress ──→ Completed
  │            │
  │            └──→ Disputed ──→ Completed (worker wins)
  │                          └──→ Cancelled (creator wins)
  └──→ Cancelled (deadline expired)
```

## Fee Structure

```
Reward: 1.000 SOL
Fee (2.5%): 0.025 SOL → Treasury PDA
Payout: 0.975 SOL → Worker
```

## RPC Endpoint

```
https://api.devnet.solana.com
```

## Program ID

```
7yn8tuqHbNFRojEgiWeSoJkYjYtmdh1w4dKA2bCgNNzA
```
