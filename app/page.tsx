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
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#060410" }}>
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-5 py-3 flex-shrink-0 z-20"
        style={{
          background: "rgba(6,4,16,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.4)",
        }}
      >
        <div className="flex items-center gap-3">
          <Link href="/about" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(255,107,53,0.15)",
                border: "1px solid rgba(255,107,53,0.3)",
              }}
            >
              <BookOpen size={14} className="text-[#ff6b35]" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-none gradient-text group-hover:opacity-80 transition-opacity">
                One-Sentence MMO
              </h1>
              <p className="text-[9px] leading-none mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                A living story · one voice at a time
              </p>
            </div>
          </Link>

          {nodeMap.size > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold"
              style={{
                background: "rgba(255,107,53,0.12)",
                color: "#ff6b35",
                border: "1px solid rgba(255,107,53,0.2)",
              }}
            >
              <Sparkles size={8} />
              {nodeMap.size} sentences
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/narrator"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:bg-white/10"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.65)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Scroll size={12} style={{ color: "#f59e0b" }} />
            Chronicle
          </Link>

          <Link
            href="/about"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:bg-white/10"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.65)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Compass size={12} style={{ color: "#6BB8FF" }} />
            About
          </Link>

          {identity && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Identicon svg={identity.identicon} size={18} />
              <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
                {identity.name}
              </span>
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
              {/* Aurora for loading state */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="aurora-a absolute rounded-full" style={{ width: "60vw", height: "50vh", top: "-10vh", left: "-10vw", background: "radial-gradient(ellipse, rgba(255,107,53,0.07) 0%, transparent 65%)", filter: "blur(60px)" }} />
                <div className="aurora-b absolute rounded-full" style={{ width: "50vw", height: "45vh", bottom: "-10vh", right: "-10vw", background: "radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 65%)", filter: "blur(60px)" }} />
              </div>
              <div className="relative flex flex-col items-center gap-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-2 border-[#ff6b35]/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-t-[#ff6b35] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  <div className="absolute inset-2 rounded-full" style={{ background: "rgba(255,107,53,0.1)" }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Loading the world…
                </p>
              </div>
            </motion.div>

          ) : isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="canvas-bg absolute inset-0 flex items-center justify-center p-6"
            >
              {/* Aurora */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="aurora-a absolute rounded-full" style={{ width: "70vw", height: "60vh", top: "-20vh", left: "-15vw", background: "radial-gradient(ellipse, rgba(255,107,53,0.08) 0%, transparent 65%)", filter: "blur(60px)" }} />
                <div className="aurora-b absolute rounded-full" style={{ width: "60vw", height: "55vh", bottom: "-20vh", right: "-10vw", background: "radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 65%)", filter: "blur(60px)" }} />
                <div className="aurora-c absolute rounded-full" style={{ width: "50vw", height: "40vh", top: "30%", left: "20%", background: "radial-gradient(ellipse, rgba(16,185,129,0.05) 0%, transparent 65%)", filter: "blur(60px)" }} />
              </div>

              <div className="relative w-full max-w-lg space-y-8 text-center">
                {/* Floating orbs */}
                <div className="flex justify-center gap-3">
                  {[
                    { c: "#FFDE5C", e: "✨" },
                    { c: "#FF7EB3", e: "🌟" },
                    { c: "#6BB8FF", e: "⚡" },
                    { c: "#A8E063", e: "🌿" },
                    { c: "#B4A0FF", e: "🔮" },
                  ].map(({ c, e }, i) => (
                    <motion.div
                      key={c}
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2.2, delay: i * 0.22, repeat: Infinity, ease: "easeInOut" }}
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg"
                      style={{
                        background: `${c}15`,
                        border: `1px solid ${c}40`,
                        boxShadow: `0 0 24px ${c}25`,
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      {e}
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h2
                    className="text-5xl font-black shimmer-text"
                    style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
                  >
                    The world awaits.
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                    No story exists yet. You hold the quill.<br />
                    Write the first sentence and kindle this world.
                  </p>
                </div>

                {/* Input card */}
                <div
                  className="rounded-3xl p-5 text-left space-y-4"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
                  }}
                >
                  {identity && (
                    <div className="flex items-center gap-2">
                      <Identicon svg={identity.identicon} size={22} />
                      <div>
                        <p className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
                          {identity.name}
                        </p>
                        <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                          first author of this world
                        </p>
                      </div>
                    </div>
                  )}

                  <textarea
                    value={beginBody}
                    onChange={(e) => setBeginBody(e.target.value)}
                    placeholder="Once upon a time, in a land no map had dared to draw…"
                    maxLength={MAX_CHARS}
                    rows={4}
                    className="w-full bg-transparent text-sm leading-[1.8] resize-none outline-none placeholder:opacity-25"
                    style={{
                      fontFamily: "var(--font-lora), Georgia, serif",
                      color: "rgba(255,255,255,0.9)",
                    }}
                  />

                  <div className="flex items-center justify-between text-[10px]">
                    <span style={{ color: "rgba(255,255,255,0.25)" }}>
                      {MAX_CHARS - beginBody.length} chars left · end with . ! ?
                    </span>
                    {beginError && <span className="text-red-400 font-medium">{beginError}</span>}
                  </div>

                  <motion.button
                    onClick={handleBeginWorld}
                    disabled={!isValid(beginBody) || beginSubmitting || !identity}
                    whileHover={isValid(beginBody) ? { scale: 1.02, y: -1 } : {}}
                    whileTap={isValid(beginBody) ? { scale: 0.97 } : {}}
                    className="w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-30"
                    style={{
                      background: isValid(beginBody)
                        ? "linear-gradient(135deg, #ff6b35, #f59e0b)"
                        : "rgba(255,255,255,0.06)",
                      color: isValid(beginBody) ? "#fff" : "rgba(255,255,255,0.3)",
                      boxShadow: isValid(beginBody) ? "0 8px 32px rgba(255,107,53,0.45)" : "none",
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

                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
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
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium px-4 py-2 rounded-full pointer-events-none"
          style={{
            color: "rgba(255,255,255,0.35)",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
          }}
        >
          Click any card to continue · Scroll to zoom · Drag to explore
        </motion.div>
      )}
    </div>
  );
}
