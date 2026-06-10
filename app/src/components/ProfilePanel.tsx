"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const SBT_LEVELS = [
  { level: 0, label: "Newcomer",   color: "text-white/40",   bg: "bg-white/5",         tasks: 0  },
  { level: 1, label: "Contributor", color: "text-blue-400",   bg: "bg-blue-400/10",     tasks: 5  },
  { level: 2, label: "Builder",    color: "text-purple-400", bg: "bg-purple-400/10",   tasks: 15 },
  { level: 3, label: "Expert",     color: "text-yellow-400", bg: "bg-yellow-400/10",   tasks: 30 },
  { level: 4, label: "Legend",     color: "text-orange-400", bg: "bg-orange-400/10",   tasks: 50 },
];

// Mock profile for UI demo
const MOCK_PROFILE = {
  username: "your_handle",
  reputation: 0,
  tasksCompleted: 0,
  tasksCreated: 0,
  sbtLevel: 0,
  skills: [],
};

export default function ProfilePanel() {
  const { connected, publicKey } = useWallet();

  if (!connected) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
        <div className="text-3xl mb-3">🔐</div>
        <h3 className="font-semibold mb-2">Connect Wallet</h3>
        <p className="text-sm text-white/40 mb-4">
          Connect Phantom to view your profile, apply for tasks, and earn reputation.
        </p>
        <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-green-500 !text-white !w-full !rounded-lg !font-medium" />
      </div>
    );
  }

  const profile = MOCK_PROFILE;
  const currentSBT = SBT_LEVELS[profile.sbtLevel];
  const nextSBT = SBT_LEVELS[Math.min(profile.sbtLevel + 1, 4)];
  const progressToNext =
    profile.sbtLevel < 4
      ? ((profile.tasksCompleted - currentSBT.tasks) /
          (nextSBT.tasks - currentSBT.tasks)) *
        100
      : 100;

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-green-400 flex items-center justify-center text-xl font-bold">
            {publicKey?.toBase58().charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold">{profile.username || "Unnamed"}</div>
            <div className="text-xs text-white/40 font-mono">
              {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-4)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center mb-4">
          <div className="bg-white/5 rounded-lg py-2">
            <div className="text-xl font-bold text-purple-400">{profile.tasksCompleted}</div>
            <div className="text-xs text-white/40">Completed</div>
          </div>
          <div className="bg-white/5 rounded-lg py-2">
            <div className="text-xl font-bold text-green-400">{profile.reputation}</div>
            <div className="text-xs text-white/40">Reputation</div>
          </div>
        </div>

        {/* SBT Level */}
        <div className={`rounded-lg p-3 ${currentSBT.bg} border border-white/5`}>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm font-semibold ${currentSBT.color}`}>
              🏅 {currentSBT.label}
            </span>
            <span className="text-xs text-white/40">SBT Level {profile.sbtLevel}</span>
          </div>
          {profile.sbtLevel < 4 && (
            <>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-green-400 rounded-full transition-all"
                  style={{ width: `${Math.max(progressToNext, 2)}%` }}
                />
              </div>
              <div className="text-xs text-white/30 mt-1">
                {profile.tasksCompleted}/{nextSBT.tasks} tasks to {nextSBT.label}
              </div>
            </>
          )}
        </div>
      </div>

      {/* SBT Levels guide */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3 text-white/70">🏆 SBT Reputation Levels</h3>
        <div className="space-y-2">
          {SBT_LEVELS.map((lvl) => (
            <div
              key={lvl.level}
              className={`flex justify-between items-center text-xs rounded-lg px-3 py-2 ${
                lvl.level === profile.sbtLevel ? lvl.bg + " border border-white/10" : "text-white/30"
              }`}
            >
              <span className={lvl.level === profile.sbtLevel ? lvl.color : ""}>
                {lvl.level === profile.sbtLevel ? "→ " : ""}{lvl.label}
              </span>
              <span>{lvl.tasks}+ tasks</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3 text-white/70">Quick Links</h3>
        <div className="space-y-2">
          {[
            { label: "📋 My Tasks", href: "#" },
            { label: "💰 Earnings", href: "#" },
            { label: "⚖️ Disputes", href: "#" },
            { label: "🔧 Edit Profile", href: "#" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="flex items-center text-sm text-white/50 hover:text-white hover:bg-white/5 rounded-lg px-3 py-2 transition"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
