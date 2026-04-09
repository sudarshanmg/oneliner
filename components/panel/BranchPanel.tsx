"use client";

import { useState, useCallback } from "react";
import { Feather, BookOpen, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Identicon } from "@/components/identity/Identicon";
import { AncestryBreadcrumb } from "./AncestryBreadcrumb";
import { CooldownTimer } from "./CooldownTimer";
import { generateIdenticon } from "@/lib/identity";
import { getAncestry, type NodeWithPosition } from "@/lib/tree";
import type { Identity } from "@/hooks/useIdentity";

const MAX_CHARS = 280;
const MIN_CHARS = 20;

interface BranchPanelProps {
  selectedId: string | null;
  nodeMap: Map<string, NodeWithPosition>;
  identity: Identity | null;
  cooldown: { onCooldown: boolean; msRemaining: number; formatted: string; refresh: () => void };
  onClose: () => void;
  onSubmit: (parentId: string, body: string) => Promise<void>;
  onSelectNode: (id: string) => void;
}

function isValidSentence(text: string): boolean {
  const t = text.trim();
  return t.length >= MIN_CHARS && t.length <= MAX_CHARS && /[.!?]$/.test(t);
}

export function BranchPanel({
  selectedId,
  nodeMap,
  identity,
  cooldown,
  onClose,
  onSubmit,
  onSelectNode,
}: BranchPanelProps) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const node = selectedId ? nodeMap.get(selectedId) : null;
  const ancestry = node ? getAncestry(node.id, nodeMap) : [];

  const handleSubmit = useCallback(async () => {
    if (!node || !identity || !isValidSentence(body)) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(node.id, body.trim());
      setBody("");
      setSuccess(true);
      cooldown.refresh();
      setTimeout(() => setSuccess(false), 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  }, [node, identity, body, onSubmit, cooldown]);

  const charCount = body.length;
  const remaining = MAX_CHARS - charCount;
  const valid = isValidSentence(body);

  return (
    <Sheet open={!!selectedId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[440px] p-0 flex flex-col"
        style={{
          background: "rgba(8, 6, 20, 0.97)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "-8px 0 64px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <SheetHeader
          className="px-5 pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(255,107,53,0.15)",
                border: "1px solid rgba(255,107,53,0.25)",
              }}
            >
              <Feather size={15} className="text-[#ff6b35]" />
            </div>
            <div>
              <SheetTitle className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.92)" }}>
                Continue the story
              </SheetTitle>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                Add your sentence to this thread
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {node && (
            <div className="px-5 py-4 space-y-4">
              {/* Story path */}
              {ancestry.length > 1 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <BookOpen size={10} style={{ color: "rgba(255,255,255,0.25)" }} />
                    <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.25)" }}>
                      Story path
                    </p>
                  </div>
                  <AncestryBreadcrumb path={ancestry} onSelect={onSelectNode} />
                </div>
              )}

              {/* Selected sentence */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <p
                  className="text-sm leading-[1.75]"
                  style={{
                    fontFamily: "var(--font-lora), Georgia, serif",
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  {node.body}
                </p>
                <div className="flex items-center gap-1.5 mt-3">
                  <Identicon svg={generateIdenticon(node.author_token)} size={14} />
                  <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {node.author_name}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.2)" }}>
                  your turn
                </span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>

              {/* Cooldown or compose */}
              {cooldown.onCooldown ? (
                <CooldownTimer msRemaining={cooldown.msRemaining} formatted={cooldown.formatted} />
              ) : (
                <div className="space-y-3">
                  {identity && (
                    <div className="flex items-center gap-2 px-1">
                      <Identicon svg={identity.identicon} size={22} />
                      <div>
                        <p className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>
                          {identity.name}
                        </p>
                        <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                          writing anonymously
                        </p>
                      </div>
                    </div>
                  )}

                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="What happens next? End with . ! or ?"
                    maxLength={MAX_CHARS}
                    rows={5}
                    className="w-full resize-none outline-none text-sm leading-[1.75] rounded-xl px-4 py-3 placeholder:opacity-25 transition-all"
                    style={{
                      fontFamily: "var(--font-lora), Georgia, serif",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.9)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.border = "1px solid rgba(255,107,53,0.4)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,107,53,0.1), inset 0 1px 0 rgba(255,255,255,0.04)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
                      e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.04)";
                    }}
                  />

                  <div className="flex items-center justify-between text-[10px] px-0.5">
                    <span style={{ color: remaining < 40 ? "#ff6b35" : "rgba(255,255,255,0.25)" }}>
                      {remaining} left
                    </span>
                    {charCount > 0 && !valid && (
                      <span style={{ color: "rgba(255,255,255,0.25)" }}>
                        {charCount < MIN_CHARS
                          ? `${MIN_CHARS - charCount} more chars`
                          : "must end with . ! or ?"}
                      </span>
                    )}
                  </div>

                  {error && (
                    <div
                      className="text-xs rounded-xl px-3 py-2"
                      style={{
                        color: "#fca5a5",
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.2)",
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    {success ? (
                      <motion.div
                        key="success"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold"
                        style={{ background: "linear-gradient(135deg, #10b981, #34d399)", color: "#fff", boxShadow: "0 4px 20px rgba(16,185,129,0.4)" }}
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: [0, 1.3, 1] }}
                          transition={{ duration: 0.4 }}
                        >
                          <Check size={16} />
                        </motion.div>
                        Added to the world!
                      </motion.div>
                    ) : (
                      <motion.button
                        key="submit"
                        onClick={handleSubmit}
                        disabled={!valid || submitting || !identity}
                        whileHover={valid ? { scale: 1.02, y: -1 } : {}}
                        whileTap={valid ? { scale: 0.96 } : {}}
                        className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all disabled:opacity-30"
                        style={{
                          background: valid
                            ? "linear-gradient(135deg, #ff6b35, #f59e0b)"
                            : "rgba(255,255,255,0.05)",
                          color: valid ? "#fff" : "rgba(255,255,255,0.25)",
                          boxShadow: valid ? "0 6px 24px rgba(255,107,53,0.4)" : "none",
                        }}
                      >
                        {submitting ? (
                          <>
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            Adding to the world…
                          </>
                        ) : (
                          <>
                            <Feather size={14} />
                            Add to the world
                          </>
                        )}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
