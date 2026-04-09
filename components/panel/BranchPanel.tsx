"use client";

import { useState, useCallback } from "react";
import { Feather, BookOpen, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
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
          background: "#ffffff",
          borderLeft: "1.5px solid #e0d9c8",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.06)",
        }}
      >
        {/* Header */}
        <SheetHeader
          className="px-5 pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: "1px solid #f0ebe0" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "#fff4ee", border: "1.5px solid #ffd5c0" }}
            >
              <Feather size={14} className="text-[#ff6b35]" />
            </div>
            <div>
              <SheetTitle className="text-sm font-bold text-[#1a1530]">
                Continue the story
              </SheetTitle>
              <p className="text-[10px] text-[#8a8098]">Add your sentence to this thread</p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {node && (
            <div className="px-5 py-4 space-y-4">
              {/* Story path */}
              {ancestry.length > 1 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <BookOpen size={10} className="text-[#c8bfa8]" />
                    <p className="text-[9px] text-[#c8bfa8] uppercase tracking-widest font-semibold">
                      Story path
                    </p>
                  </div>
                  <AncestryBreadcrumb path={ancestry} onSelect={onSelectNode} />
                </div>
              )}

              {/* Selected sentence card */}
              <div
                className="rounded-2xl p-4"
                style={{ background: "#faf8f4", border: "1.5px solid #e0d9c8" }}
              >
                <p
                  className="text-sm leading-[1.7] text-[#1a1530]"
                  style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
                >
                  {node.body}
                </p>
                <div className="flex items-center gap-1.5 mt-3">
                  <Identicon svg={generateIdenticon(node.author_token)} size={14} />
                  <span className="text-[10px] text-[#8a8098] font-medium">{node.author_name}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#f0ebe0]" />
                <span className="text-[10px] text-[#c8bfa8] font-semibold uppercase tracking-wide">your turn</span>
                <div className="flex-1 h-px bg-[#f0ebe0]" />
              </div>

              {/* Cooldown or input */}
              {cooldown.onCooldown ? (
                <CooldownTimer msRemaining={cooldown.msRemaining} formatted={cooldown.formatted} />
              ) : (
                <div className="space-y-3">
                  {/* Identity */}
                  {identity && (
                    <div className="flex items-center gap-2 px-1">
                      <Identicon svg={identity.identicon} size={22} />
                      <div>
                        <p className="text-xs font-bold text-[#1a1530]">{identity.name}</p>
                        <p className="text-[9px] text-[#8a8098]">writing anonymously</p>
                      </div>
                    </div>
                  )}

                  {/* Textarea */}
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="What happens next? End with . ! or ?"
                    className="resize-none text-sm text-[#1a1530] placeholder:text-[#c8bfa8] min-h-[120px] focus-visible:ring-[#ff6b35]/30 focus-visible:border-[#ff6b35]/50"
                    style={{
                      fontFamily: "var(--font-lora), Georgia, serif",
                      background: "#faf8f4",
                      border: "1.5px solid #e0d9c8",
                      lineHeight: "1.7",
                    }}
                    maxLength={MAX_CHARS}
                  />

                  {/* Counter + hints */}
                  <div className="flex items-center justify-between text-[10px] px-0.5">
                    <span className={remaining < 40 ? "text-[#ff6b35] font-semibold" : "text-[#c8bfa8]"}>
                      {remaining} left
                    </span>
                    {charCount > 0 && !valid && (
                      <span className="text-[#c8bfa8]">
                        {charCount < MIN_CHARS
                          ? `${MIN_CHARS - charCount} more chars`
                          : "must end with . ! or ?"}
                      </span>
                    )}
                  </div>

                  {error && (
                    <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                      {error}
                    </div>
                  )}

                  {/* Submit button — with success animation */}
                  <AnimatePresence mode="wait">
                    {success ? (
                      <motion.div
                        key="success"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold"
                        style={{ background: "#10b981", color: "#fff" }}
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
                        className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all disabled:opacity-40"
                        style={{
                          background: valid
                            ? "linear-gradient(135deg, #ff6b35, #f59e0b)"
                            : "#f0ebe0",
                          color: valid ? "#fff" : "#c8bfa8",
                          boxShadow: valid ? "0 4px 16px rgba(255,107,53,0.35)" : "none",
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
