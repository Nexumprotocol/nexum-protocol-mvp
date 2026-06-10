"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

interface Props {
  onClose: () => void;
}

export default function CreateTaskModal({ onClose }: Props) {
  const { connected } = useWallet();
  const [form, setForm] = useState({
    title: "",
    description: "",
    skills: "",
    rewardSOL: "",
    deadlineDays: "7",
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");

  const handleSubmit = async () => {
    if (!form.title || !form.rewardSOL) return;
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setLoading(true);
    // TODO: wire to program.methods.createTask()
    // This is where Phantom wallet will prompt for signature
    await new Promise((r) => setTimeout(r, 2000));
    setStep("success");
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#10111f] border border-white/15 rounded-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="font-bold text-lg">
            {step === "success" ? "✅ Task Posted!" : "Post a New Task"}
          </h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-xl transition"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {step === "form" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Build Solana DEX UI"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition"
                  maxLength={80}
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Description *</label>
                <textarea
                  rows={4}
                  placeholder="Describe the task requirements..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition resize-none"
                  maxLength={500}
                />
                <div className="text-xs text-white/30 mt-1 text-right">{form.description.length}/500</div>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Required Skills</label>
                <input
                  type="text"
                  placeholder="rust, solana, react (comma separated)"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Reward (SOL) *</label>
                  <input
                    type="number"
                    placeholder="0.5"
                    min="0.001"
                    step="0.01"
                    value={form.rewardSOL}
                    onChange={(e) => setForm({ ...form, rewardSOL: e.target.value })}
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Deadline (days)</label>
                  <select
                    value={form.deadlineDays}
                    onChange={(e) => setForm({ ...form, deadlineDays: e.target.value })}
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                  >
                    {[3, 7, 14, 30].map((d) => (
                      <option key={d} value={d} className="bg-[#10111f]">
                        {d} days
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-xs text-purple-300">
                💡 Reward will be locked in escrow when task is created. 2.5% platform fee deducted on completion.
              </div>

              <button
                onClick={handleSubmit}
                disabled={!form.title || !form.rewardSOL}
                className="w-full bg-gradient-to-r from-purple-600 to-green-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Review Transaction
              </button>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Task</span>
                  <span className="font-medium">{form.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Reward</span>
                  <span className="text-green-400 font-semibold">{form.rewardSOL} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Platform fee (2.5%)</span>
                  <span className="text-white/40">
                    {(parseFloat(form.rewardSOL || "0") * 0.025).toFixed(4)} SOL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Deadline</span>
                  <span>{form.deadlineDays} days from now</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Network</span>
                  <span className="text-yellow-400">Devnet</span>
                </div>
              </div>

              <p className="text-xs text-white/40 text-center">
                Phantom wallet will prompt you to sign and pay {form.rewardSOL} SOL into escrow
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("form")}
                  className="flex-1 bg-white/5 text-white py-3 rounded-lg font-medium hover:bg-white/10 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-green-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? "Signing..." : "Sign & Post"}
                </button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="font-bold text-lg mb-2">Task is live on Devnet!</h3>
              <p className="text-white/50 text-sm mb-6">
                {form.rewardSOL} SOL is locked in escrow. Contributors can apply now.
              </p>
              <button
                onClick={onClose}
                className="bg-gradient-to-r from-purple-600 to-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                View Task Board
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
