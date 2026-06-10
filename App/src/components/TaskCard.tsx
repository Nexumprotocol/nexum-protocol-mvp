"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { NexumTask, TaskStatus } from "@/types";

interface Props {
  task: NexumTask;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  [TaskStatus.Open]:       { label: "Open",        color: "text-green-400",  bg: "bg-green-400/10 border-green-400/30"  },
  [TaskStatus.InProgress]: { label: "In Progress",  color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" },
  [TaskStatus.Completed]:  { label: "Completed",    color: "text-blue-400",   bg: "bg-blue-400/10 border-blue-400/30"    },
  [TaskStatus.Disputed]:   { label: "Disputed",     color: "text-red-400",    bg: "bg-red-400/10 border-red-400/30"      },
  [TaskStatus.Cancelled]:  { label: "Cancelled",    color: "text-white/30",   bg: "bg-white/5 border-white/10"           },
};

export default function TaskCard({ task }: Props) {
  const { connected, publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const status = STATUS_CONFIG[task.status];

  const daysLeft = Math.max(
    0,
    Math.floor((task.deadlineUnix - Date.now() / 1000) / 86400)
  );
  const rewardSOL = (task.rewardLamports / 1e9).toFixed(3);

  const handleApply = async () => {
    if (!connected) return alert("Connect wallet first");
    setLoading(true);
    // TODO: wire to program.methods.applyTask()
    await new Promise((r) => setTimeout(r, 1200));
    alert(`Applied for: ${task.title}\n\nTransaction would go to Devnet`);
    setLoading(false);
  };

  const handleDispute = async () => {
    if (!connected) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    alert("Dispute opened — resolver will review within 48h");
    setLoading(false);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-purple-500/40 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-white group-hover:text-purple-300 transition line-clamp-2">
          {task.title}
        </h3>
        <span className={`shrink-0 text-xs px-2 py-1 rounded-full border ${status.bg} ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-white/50 mb-4 line-clamp-2">{task.description}</p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {task.requiredSkills.map((skill) => (
          <span
            key={skill}
            className="text-xs bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-md border border-purple-500/20"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-white/40">
          <span>
            <span className="text-purple-400 font-semibold text-sm">{rewardSOL} SOL</span> reward
          </span>
          <span>⏱ {daysLeft}d left</span>
          {task.worker && (
            <span className="text-yellow-400">👤 {task.worker.slice(0, 8)}...</span>
          )}
        </div>

        <div className="flex gap-2">
          {task.status === TaskStatus.Open && (
            <button
              onClick={handleApply}
              disabled={loading}
              className="text-xs bg-gradient-to-r from-purple-600 to-green-500 text-white px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "..." : "Apply"}
            </button>
          )}
          {task.status === TaskStatus.InProgress &&
            publicKey?.toBase58().startsWith(task.creator.slice(0, 4)) && (
              <button
                onClick={handleDispute}
                disabled={loading}
                className="text-xs bg-red-500/20 text-red-400 border border-red-400/30 px-3 py-1.5 rounded-lg font-medium hover:bg-red-500/30 transition"
              >
                Dispute
              </button>
          )}
        </div>
      </div>
    </div>
  );
}
