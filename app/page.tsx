"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Scroll, Feather, BookOpen, Sparkles, Compass } from "lucide-react";
import { WorldCanvas } from "@/components/canvas/WorldCanvas";
import { BranchPanel } from "@/components/panel/BranchPanel";
import { Identicon } from "@/components/identity/Identicon";
import { useIdentity } from "@/hooks/useIdentity";
import { useTree } from "@/hooks/useTree";
import { useRealtime } from "@/hooks/useRealtime";
import { useCooldown } from "@/hooks/useCooldown";
import type { Sentence } from "@/lib/supabase/types";

const MIN_CHARS = 20;
const MAX_CHARS = 280;

function isValid(text: string) {
  const t = text.trim();
  return t.length >= MIN_CHARS && t.length <= MAX_CHARS && /[.!?]$/.test(t);
}

export default function WorldPage() {
  const identity = useIdentity();
  const { root, nodeMap, loading, addSentence, updateVotes } = useTree();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newNodeIds, setNewNodeIds] = useState<Set<string>>(new Set());
  const [centerKey, setCenterKey] = useState(0);

  // Begin-world state
  const [beginBody, setBeginBody] = useState("");
  const [beginSubmitting, setBeginSubmitting] = useState(false);
  const [beginError, setBeginError] = useState<string | null>(null);

  const cooldown = useCooldown(identity?.token ?? null);

  const markNew = useCallback((id: string) => {
    setNewNodeIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setNewNodeIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }, 2000);
  }, []);

  const handleRealtimeInsert = useCallback(
    (sentence: Sentence) => {
      if (sentence.author_token === identity?.token) return;
      addSentence(sentence);
      markNew(sentence.id);
    },
    [identity?.token, addSentence, markNew]
  );

  useRealtime(handleRealtimeInsert);

  const doSubmit = useCallback(async (parentId: string | null, body: string): Promise<Sentence> => {
    if (!identity) throw new Error("No identity.");
    const res = await fetch("/api/sentences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parent_id: parentId,
        body,
        author_token: identity.token,
        author_name: identity.name,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Failed to submit.");
    }
    return res.json();
  }, [identity]);

  const handleSubmit = useCallback(async (parentId: string, body: string) => {
    const s = await doSubmit(parentId, body);
    addSentence(s);
    markNew(s.id);
    setSelectedId(s.id);
  }, [doSubmit, addSentence, markNew]);

  const handleBeginWorld = useCallback(async () => {
    if (!isValid(beginBody)) return;
    setBeginSubmitting(true);
    setBeginError(null);
    try {
      const s = await doSubmit(null, beginBody.trim());
      addSentence(s);
      markNew(s.id);
      setBeginBody("");
      cooldown.refresh();
    } catch (e) {
      setBeginError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBeginSubmitting(false);
    }
  }, [beginBody, doSubmit, addSentence, markNew, cooldown]);

  const handleVote = useCallback(async (sentenceId: string) => {
    if (!identity) return;
    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sentence_id: sentenceId, author_token: identity.token }),
    });
    if (res.ok) {
      const { votes } = await res.json();
      updateVotes(sentenceId, votes);
    }
  }, [identity, updateVotes]);

  const isEmpty = !loading && nodeMap.size === 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#f7f3e9" }}>
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-5 py-2.5 flex-shrink-0 z-20"
        style={{
          background: "#ffffff",
          borderBottom: "1.5px solid #e0d9c8",
          boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-center gap-3">
            <Link href="/about" className="flex items-center gap-2 group">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "#fff4ee", border: "1.5px solid #ffd5c0" }}
            >
              <BookOpen size={14} className="text-[#ff6b35]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#1a1530] leading-none group-hover:text-[#ff6b35] transition-colors">
                One-Sentence <span className="text-[#ff6b35]">MMO</span>
              </h1>
              <p className="text-[9px] text-[#c8bfa8] leading-none mt-0.5">
                A living story · one voice at a time
              </p>
            </div>
          </Link>

          {nodeMap.size > 0 && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold"
              style={{
                background: "#fff4ee",
                color: "#ff6b35",
                border: "1px solid #ffd5c0",
              }}
            >
              <Sparkles size={8} />
              {nodeMap.size} sentences
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/narrator"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:shadow-sm"
            style={{
              background: "#faf8f4",
              color: "#5a5070",
              border: "1.5px solid #e0d9c8",
            }}
          >
            <Scroll size={12} className="text-[#f59e0b]" />
            Chronicle
          </Link>
          <Link
            href="/about"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:shadow-sm"
            style={{
              background: "#faf8f4",
              color: "#5a5070",
              border: "1.5px solid #e0d9c8",
            }}
          >
            <Compass size={12} className="text-[#6BB8FF]" />
            About
          </Link>

          {identity && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{ background: "#faf8f4", border: "1.5px solid #e0d9c8" }}
            >
              <Identicon svg={identity.identicon} size={18} />
              <span className="text-xs font-semibold text-[#5a5070]">{identity.name}</span>
            </div>
          )}
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="canvas-bg absolute inset-0 flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-3 border-[#ff6b35] border-t-transparent animate-spin" />
                <p className="text-sm font-medium text-[#8a8098]">Loading the world…</p>
              </div>
            </motion.div>

          ) : isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="canvas-bg absolute inset-0 flex items-center justify-center p-6"
            >
              <div className="w-full max-w-lg space-y-6 text-center">
                {/* Floating icons */}
                <div className="flex justify-center gap-3">
                  {["#FFDE5C", "#FF7EB3", "#6BB8FF", "#A8E063", "#B4A0FF"].map((c, i) => (
                    <motion.div
                      key={c}
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 2, delay: i * 0.2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-md"
                      style={{ background: c }}
                    >
                      {["✨", "🌟", "⚡", "🌿", "🔮"][i]}
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h2
                    className="text-4xl font-bold shimmer-text"
                    style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
                  >
                    The world awaits.
                  </h2>
                  <p className="text-sm text-[#8a8098] leading-relaxed">
                    No story exists here yet. You hold the quill.<br />
                    Write the first sentence and kindle this world.
                  </p>
                </div>

                {/* Input card */}
                <div
                  className="rounded-3xl p-5 text-left space-y-3 shadow-xl"
                  style={{ background: "#fff", border: "2px solid #e0d9c8" }}
                >
                  {identity && (
                    <div className="flex items-center gap-2">
                      <Identicon svg={identity.identicon} size={22} />
                      <div>
                        <p className="text-xs font-bold text-[#1a1530]">{identity.name}</p>
                        <p className="text-[9px] text-[#c8bfa8]">first author of this world</p>
                      </div>
                    </div>
                  )}

                  <textarea
                    value={beginBody}
                    onChange={(e) => setBeginBody(e.target.value)}
                    placeholder="Once upon a time, in a land no map had dared to draw…"
                    maxLength={MAX_CHARS}
                    rows={4}
                    className="w-full bg-transparent text-sm leading-[1.8] resize-none outline-none text-[#1a1530] placeholder:text-[#c8bfa8]"
                    style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
                  />

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#c8bfa8]">{MAX_CHARS - beginBody.length} chars left · end with . ! ?</span>
                    {beginError && <span className="text-red-500 font-medium">{beginError}</span>}
                  </div>

                  <motion.button
                    onClick={handleBeginWorld}
                    disabled={!isValid(beginBody) || beginSubmitting || !identity}
                    whileHover={isValid(beginBody) ? { scale: 1.02, y: -1 } : {}}
                    whileTap={isValid(beginBody) ? { scale: 0.97 } : {}}
                    className="w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                    style={{
                      background: isValid(beginBody)
                        ? "linear-gradient(135deg, #ff6b35, #f59e0b)"
                        : "#f0ebe0",
                      color: isValid(beginBody) ? "#fff" : "#c8bfa8",
                      boxShadow: isValid(beginBody) ? "0 6px 24px rgba(255,107,53,0.4)" : "none",
                    }}
                  >
                    {beginSubmitting ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Kindling the world…
                      </>
                    ) : (
                      <>
                        <Feather size={15} />
                        Kindle this world
                      </>
                    )}
                  </motion.button>
                </div>

                <p className="text-[10px] text-[#c8bfa8]">
                  One sentence per hour · Anonymous · All voices welcome
                </p>
              </div>
            </motion.div>

          ) : (
            <motion.div
              key="canvas"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0"
            >
              <WorldCanvas
                nodeMap={nodeMap}
                root={root}
                selectedId={selectedId}
                userToken={identity?.token ?? null}
                newNodeIds={newNodeIds}
                centerKey={centerKey}
                onSelectNode={setSelectedId}
                onBranchNode={(id) => setSelectedId(id)}
                onVote={handleVote}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BranchPanel
        selectedId={selectedId}
        nodeMap={nodeMap}
        identity={identity}
        cooldown={cooldown}
        onClose={() => setSelectedId(null)}
        onSubmit={handleSubmit}
        onSelectNode={setSelectedId}
      />

      {!loading && !isEmpty && !selectedId && (
        <div
          className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium px-3 py-1.5 rounded-full pointer-events-none"
          style={{
            color: "#8a8098",
            background: "rgba(255,255,255,0.85)",
            border: "1px solid #e0d9c8",
            backdropFilter: "blur(8px)",
          }}
        >
          Click any card to continue · Scroll to zoom · Drag to explore
        </div>
      )}
    </div>
  );
}
