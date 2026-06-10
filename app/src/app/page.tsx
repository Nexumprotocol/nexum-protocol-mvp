"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import CreateTaskModal from "@/components/CreateTaskModal";
import TaskCard from "@/components/TaskCard";
import ProfilePanel from "@/components/ProfilePanel";
import { TaskStatus, NexumTask } from "@/types";

const PROGRAM_ID = new PublicKey("NXMprotoco1111111111111111111111111111111111");
const DEVNET_RPC = clusterApiUrl("devnet");

export default function Home() {
  const { publicKey, connected } = useWallet();
  const [tasks, setTasks] = useState<NexumTask[]>([]);
  const [filter, setFilter] = useState<"all" | "open" | "mine">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock tasks for UI demo (replace with on-chain fetch in production)
  useEffect(() => {
    setTasks([
      {
        taskId: "1",
        creator: "8xN2...4Kpq",
        title: "Build Solana DEX UI",
        description: "Implement swap interface using @solana/kit and Phantom wallet",
        requiredSkills: ["react", "solana", "typescript"],
        rewardLamports: 500_000_000, // 0.5 SOL
        deadlineUnix: Math.floor(Date.now() / 1000) + 86400 * 7,
        status: TaskStatus.Open,
        worker: null,
      },
      {
        taskId: "2",
        creator: "3mFx...9Rsl",
        title: "Write Anchor smart contract audit",
        description: "Audit NEXUM escrow contract and produce security report",
        requiredSkills: ["rust", "security", "anchor"],
        rewardLamports: 300_000_000, // 0.3 SOL
        deadlineUnix: Math.floor(Date.now() / 1000) + 86400 * 14,
        status: TaskStatus.InProgress,
        worker: "7yKp...2Wzq",
      },
      {
        taskId: "3",
        creator: "5qAb...8Tnv",
        title: "Design NEXUM token logo variants",
        description: "Create 5 NXM token logo variants in SVG format",
        requiredSkills: ["design", "figma", "web3"],
        rewardLamports: 150_000_000, // 0.15 SOL
        deadlineUnix: Math.floor(Date.now() / 1000) + 86400 * 3,
        status: TaskStatus.Open,
        worker: null,
      },
    ]);
  }, []);

  const filteredTasks = tasks.filter((t) => {
    if (filter === "open") return t.status === TaskStatus.Open;
    if (filter === "mine" && publicKey)
      return t.creator === publicKey.toBase58().slice(0, 4) + "...";
    return true;
  });

  return (
    <main className="min-h-screen bg-[#0a0b14] text-white">
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50 bg-[#0a0b14]/90 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-green-400 flex items-center justify-center font-bold text-sm">
            N
          </div>
          <span className="font-bold text-lg tracking-tight">NEXUM Protocol</span>
          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
            Devnet
          </span>
        </div>

        <div className="flex items-center gap-4">
          {connected && (
            <button
              onClick={() => setShowCreate(true)}
              className="bg-gradient-to-r from-purple-600 to-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition"
            >
              + Post Task
            </button>
          )}
          <WalletMultiButton className="!bg-white/10 !text-white !rounded-lg !text-sm !font-medium hover:!bg-white/20" />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6">
        {/* ── Main content ─────────────────────────────────────────── */}
        <div className="flex-1">
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Open Tasks", value: tasks.filter(t => t.status === TaskStatus.Open).length, color: "text-green-400" },
              { label: "Total SOL Escrowed", value: `${(tasks.reduce((s, t) => s + t.rewardLamports, 0) / 1e9).toFixed(2)} SOL`, color: "text-purple-400" },
              { label: "Contributors", value: "12", color: "text-cyan-400" },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-sm text-white/50 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-6">
            {(["all", "open", "mine"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                  filter === f
                    ? "bg-purple-600 text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {f === "mine" ? "My Tasks" : f}
              </button>
            ))}
          </div>

          {/* Task grid */}
          {loading ? (
            <div className="text-center py-20 text-white/40">Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-20 text-white/40">
              <div className="text-4xl mb-3">📭</div>
              <div>No tasks found</div>
              {connected && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-4 text-purple-400 hover:text-purple-300 text-sm"
                >
                  Post the first task →
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.map((task) => (
                <TaskCard key={task.taskId} task={task} />
              ))}
            </div>
          )}
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <div className="w-80 shrink-0">
          <ProfilePanel />
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────── */}
      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} />}
    </main>
  );
}
