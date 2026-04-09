"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Feather, X, Check } from "lucide-react";
import { Identicon } from "@/components/identity/Identicon";
import { generateIdenticon } from "@/lib/identity";
import { getAncestry, type NodeWithPosition } from "@/lib/tree";
import type { Identity } from "@/hooks/useIdentity";
import { CooldownTimer } from "./CooldownTimer";

const MAX_CHARS = 280;
const MIN_CHARS = 20;

function isValid(text: string) {
  const t = text.trim();
  return t.length >= MIN_CHARS && t.length <= MAX_CHARS && /[.!?]$/.test(t);
}

interface CharItem {
  id: number;
  char: string;
}

function QuillSVG() {
  return (
    <svg width="26" height="84" viewBox="0 0 26 84" fill="none">
      <path
        d="M13 2 C 23 11, 26 36, 13 68 C 0 36, 3 11, 13 2 Z"
        fill="rgba(248,238,195,0.96)"
        stroke="rgba(170,130,50,0.45)"
        strokeWidth="0.6"
      />
      <path
        d="M13 6 C 20 17, 21 40, 13 64 C 7 40, 8 17, 13 6 Z"
        fill="rgba(255,248,215,0.55)"
      />
      {[0,1,2,3,4,5,6].map(i => (
        <path key={`l${i}`} d={`M13 ${14+i*7} Q ${8-i*0.2} ${16+i*7} ${4-i*0.1} ${18+i*7}`} stroke="rgba(168,128,48,0.28)" strokeWidth="0.65" fill="none"/>
      ))}
      {[0,1,2,3,4,5,6].map(i => (
        <path key={`r${i}`} d={`M13 ${14+i*7} Q ${18+i*0.2} ${16+i*7} ${22+i*0.1} ${18+i*7}`} stroke="rgba(168,128,48,0.28)" strokeWidth="0.65" fill="none"/>
      ))}
      <line x1="13" y1="5" x2="13" y2="80" stroke="rgba(140,100,32,0.6)" strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M10.5 75 L13 84 L15.5 75 Q13 78 10.5 75 Z" fill="#180900"/>
    </svg>
  );
}

interface WriteModalProps {
  node: NodeWithPosition;
  nodeMap: Map<string, NodeWithPosition>;
  identity: Identity | null;
  cooldown: { onCooldown: boolean; msRemaining: number; formatted: string; refresh: () => void };
  onClose: () => void;
  onSubmit: (parentId: string, body: string) => Promise<void>;
  onSelectNode: (id: string) => void;
}

export function WriteModal({
  node,
  nodeMap,
  identity,
  cooldown,
  onClose,
  onSubmit,
  onSelectNode,
}: WriteModalProps) {
  const [chars, setChars] = useState<CharItem[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quillTarget, setQuillTarget] = useState({ x: 0, y: 8 });

  const charIdRef = useRef(0);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const writingAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const body = chars.map(c => c.char).join("");
  const valid = isValid(body);
  const ancestry = getAncestry(node.id, nodeMap);

  // Focus textarea on open
  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  // Track quill position to cursor
  useEffect(() => {
    const cursor = cursorRef.current;
    const container = writingAreaRef.current;
    if (!cursor || !container) return;
    const cr = cursor.getBoundingClientRect();
    const br = container.getBoundingClientRect();
    setQuillTarget({ x: cr.left - br.left, y: cr.top - br.top });
  }, [chars]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value.slice(0, MAX_CHARS);
    const prev = chars.map(c => c.char).join("");
    if (next === prev) return;

    if (next.length > prev.length && next.startsWith(prev)) {
      const added = next.slice(prev.length).split("").map(char => ({ id: charIdRef.current++, char }));
      setChars(p => [...p, ...added]);
    } else if (next.length < prev.length && prev.startsWith(next)) {
      setChars(p => p.slice(0, next.length));
    } else {
      setChars(next.split("").map(char => ({ id: charIdRef.current++, char })));
    }

    setIsTyping(true);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => setIsTyping(false), 500);
  }, [chars]);

  const handleSubmit = useCallback(async () => {
    if (!node || !identity || !valid) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(node.id, body.trim());
      setSuccess(true);
      setChars([]);
      cooldown.refresh();
      setTimeout(onClose, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  }, [node, identity, valid, body, onSubmit, cooldown, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        background: "rgba(2,1,10,0.9)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      {/* Parchment */}
      <motion.div
        initial={{ scale: 0.87, opacity: 0, y: 28 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.87, opacity: 0, y: 28 }}
        transition={{ type: "spring", stiffness: 290, damping: 26 }}
        onClick={e => e.stopPropagation()}
        style={{ position: "relative", width: "min(640px, 100%)", maxHeight: "88vh" }}
      >
        {/* Shadow */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(60,30,0,0.55)", filter: "blur(28px)", transform: "translateY(10px) scale(0.97)", zIndex: -1 }} />

        {/* The paper */}
        <div
          style={{
            background: "linear-gradient(158deg, #f9f1d8 0%, #f2e4ba 38%, #ede0ae 68%, #f0dfaa 100%)",
            clipPath: `polygon(
              0% 2.2%, 2% 0.3%, 4% 2%, 6.5% 0%, 9% 1.8%, 11.5% 0.2%, 14% 2.2%,
              17% 0%, 20% 1.8%, 23% 0.3%, 26% 2.2%, 29% 0%, 32% 1.5%, 35.5% 0.3%,
              38% 2.2%, 41% 0%, 44% 1.8%, 47.5% 0.2%, 50% 2.2%, 53% 0%, 56% 1.8%,
              59.5% 0.3%, 62% 2.2%, 65% 0%, 68% 1.8%, 71.5% 0.2%, 74% 2.2%, 77% 0%,
              80% 1.5%, 83.5% 0.3%, 86% 2.2%, 89% 0%, 92% 1.8%, 95.5% 0.2%, 98% 1.8%, 100% 0.8%,
              100% 99.2%,
              98% 100%, 95.5% 98.2%, 93% 100%, 90% 98.5%, 87% 100%,
              84% 98.2%, 81% 100%, 78% 98.5%, 75% 100%, 72% 98.2%, 69% 100%,
              66% 98.5%, 63% 100%, 60% 98.2%, 57% 100%, 54% 98.5%, 51% 100%,
              48% 98.2%, 45% 100%, 42% 98.5%, 39% 100%, 36% 98.2%, 33% 100%,
              30% 98.5%, 27% 100%, 24% 98.2%, 21% 100%, 18% 98.5%, 15% 100%,
              12% 98.2%, 9% 100%, 6% 98.5%, 3% 100%, 0% 98.2%
            )`,
            padding: "34px 34px 42px",
            position: "relative",
            overflowY: "auto",
            maxHeight: "88vh",
          }}
        >
          {/* Paper grain */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.5, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E")` }} />
          {/* Aging spots */}
          <div style={{ position: "absolute", top: "12%", right: "7%", width: 55, height: 38, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(155,100,25,0.07), transparent)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "22%", left: "4%", width: 38, height: 28, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(140,88,18,0.06), transparent)", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Top row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Feather size={13} style={{ color: "rgba(100,62,12,0.55)" }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "rgba(100,62,12,0.45)" }}>
                  Continue the story
                </span>
              </div>
              <button
                onClick={onClose}
                style={{ color: "rgba(100,62,12,0.38)", padding: 2 }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(100,62,12,0.75)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(100,62,12,0.38)")}
              >
                <X size={15} />
              </button>
            </div>

            {/* Ancestry breadcrumb */}
            {ancestry.length > 1 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 4px", alignItems: "center", marginBottom: 10 }}>
                {ancestry.slice(0, -1).map((n, i) => (
                  <span key={n.id} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <button
                      onClick={() => { onSelectNode(n.id); onClose(); }}
                      title={n.body}
                      style={{ fontSize: 10, color: "rgba(100,62,12,0.38)", fontFamily: "var(--font-lora)", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "rgba(100,62,12,0.7)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(100,62,12,0.38)")}
                    >
                      {n.body.slice(0, 20)}…
                    </button>
                    {i < ancestry.length - 2 && <span style={{ fontSize: 9, color: "rgba(100,62,12,0.22)" }}>›</span>}
                  </span>
                ))}
                <span style={{ fontSize: 9, color: "rgba(100,62,12,0.22)" }}>›</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(100,62,12,0.52)", fontFamily: "var(--font-lora)" }}>this</span>
              </div>
            )}

            {/* Parent sentence */}
            <div style={{ padding: "11px 15px", marginBottom: 18, background: "rgba(140,90,18,0.07)", borderLeft: "3px solid rgba(155,105,35,0.38)", borderRadius: "0 10px 10px 0" }}>
              <p style={{ fontSize: 14, color: "rgba(55,30,5,0.82)", fontFamily: "var(--font-lora), Georgia, serif", lineHeight: 1.65, margin: 0 }}>
                {node.body}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7 }}>
                <Identicon svg={generateIdenticon(node.author_token)} size={12} />
                <span style={{ fontSize: 9, color: "rgba(100,62,12,0.4)" }}>{node.author_name}</span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(145,105,35,0.18)" }} />
              <span style={{ fontSize: 9, color: "rgba(100,62,12,0.32)", letterSpacing: "0.07em", textTransform: "uppercase" }}>your turn</span>
              <div style={{ flex: 1, height: 1, background: "rgba(145,105,35,0.18)" }} />
            </div>

            {cooldown.onCooldown ? (
              <CooldownTimer msRemaining={cooldown.msRemaining} formatted={cooldown.formatted} />
            ) : (
              <>
                {/* Writing surface */}
                <div
                  ref={writingAreaRef}
                  style={{ position: "relative", minHeight: 200, cursor: "text" }}
                  onClick={() => textareaRef.current?.focus()}
                >
                  {/* Ruled lines */}
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} style={{ position: "absolute", left: 0, right: 0, top: i * 32 + 26, height: 1, background: "rgba(145,105,35,0.13)", pointerEvents: "none" }} />
                  ))}

                  {/* Hidden input — 1×1 so it doesn't constrain container height */}
                  <textarea
                    ref={textareaRef}
                    value={body}
                    onChange={handleInput}
                    maxLength={MAX_CHARS}
                    style={{ position: "absolute", top: 0, left: 0, width: 1, height: 1, opacity: 0, resize: "none", overflow: "hidden", zIndex: 5, cursor: "text" }}
                  />

                  {/* Animated characters */}
                  <div style={{ fontFamily: "var(--font-lora), Georgia, serif", fontSize: 15, lineHeight: "32px", color: "#170900", letterSpacing: "0.01em", paddingRight: 40, position: "relative", minHeight: 200, paddingBottom: 8, whiteSpace: "pre-wrap", overflowWrap: "break-word", wordBreak: "break-word" }}>
                    <AnimatePresence initial={false}>
                      {chars.map(item => (
                        <motion.span
                          key={item.id}
                          initial={{ opacity: 0, y: 5, filter: "blur(4px)" }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          exit={{ opacity: 0, scaleX: 0 }}
                          transition={{ duration: 0.13, ease: "easeOut" }}
                          style={{ display: item.char === "\n" ? "block" : "inline" }}
                        >
                          {item.char === "\n" ? null : item.char}
                        </motion.span>
                      ))}
                    </AnimatePresence>
                    {/* Cursor anchor */}
                    <span ref={cursorRef} style={{ display: "inline-block", width: 1, height: "1em", verticalAlign: "text-bottom" }} />
                  </div>

                  {/* Placeholder */}
                  {chars.length === 0 && (
                    <p style={{ position: "absolute", top: 0, left: 0, margin: 0, fontFamily: "var(--font-lora), Georgia, serif", fontSize: 15, lineHeight: "32px", color: "rgba(100,62,12,0.26)", fontStyle: "italic", pointerEvents: "none" }}>
                      What happens next…
                    </p>
                  )}

                  {/* Quill */}
                  <motion.div
                    animate={{
                      x: quillTarget.x + 7,
                      y: quillTarget.y - 76,
                      rotate: isTyping ? -36 : -43,
                    }}
                    transition={{ type: "spring", stiffness: 460, damping: 32 }}
                    style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 10, originY: 1 }}
                  >
                    <QuillSVG />
                    {/* Ink drop */}
                    <AnimatePresence>
                      {isTyping && (
                        <motion.div
                          key="drop"
                          initial={{ scale: 0, opacity: 0.9 }}
                          animate={{ scale: 1.8, opacity: 0 }}
                          exit={{}}
                          transition={{ duration: 0.38 }}
                          style={{ position: "absolute", bottom: -1, left: "50%", translateX: "-50%", width: 5, height: 5, borderRadius: "50%", background: "#180900" }}
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                {/* Bottom bar */}
                <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 10, color: body.length > MAX_CHARS - 40 ? "#b45309" : "rgba(100,62,12,0.36)" }}>
                    {MAX_CHARS - body.length} chars · ends . ! or ?
                  </span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      onClick={onClose}
                      style={{ fontSize: 12, fontWeight: 500, color: "rgba(100,62,12,0.42)", padding: "6px 10px", borderRadius: 8 }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(100,62,12,0.08)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      Discard
                    </button>

                    <AnimatePresence mode="wait">
                      {success ? (
                        <motion.div
                          key="ok"
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.85, opacity: 0 }}
                          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg, #10b981, #34d399)", padding: "8px 18px", borderRadius: 12, boxShadow: "0 4px 20px rgba(16,185,129,0.4)" }}
                        >
                          <Check size={14} /> Woven into the world!
                        </motion.div>
                      ) : (
                        <motion.button
                          key="go"
                          onClick={handleSubmit}
                          disabled={!valid || submitting}
                          whileHover={valid ? { scale: 1.04, y: -1 } : {}}
                          whileTap={valid ? { scale: 0.96 } : {}}
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            fontSize: 13, fontWeight: 700,
                            padding: "8px 20px", borderRadius: 12,
                            background: valid ? "linear-gradient(135deg, #7c3a0a, #4a2008)" : "rgba(100,62,12,0.1)",
                            color: valid ? "#f8e8c0" : "rgba(100,62,12,0.28)",
                            boxShadow: valid ? "0 6px 20px rgba(80,30,0,0.4)" : "none",
                            border: valid ? "1px solid rgba(175,115,38,0.28)" : "1px solid rgba(100,62,12,0.08)",
                            opacity: submitting ? 0.75 : 1,
                          }}
                        >
                          {submitting
                            ? <><div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #f8e8c0", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} /> Weaving…</>
                            : <><Feather size={12} /> Weave into the world</>
                          }
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {error && (
                  <div style={{ marginTop: 10, fontSize: 11, color: "#92400e", background: "rgba(180,83,9,0.09)", border: "1px solid rgba(180,83,9,0.18)", borderRadius: 8, padding: "6px 10px" }}>
                    {error}
                  </div>
                )}

                {identity && (
                  <div style={{ marginTop: 14, paddingTop: 11, borderTop: "1px solid rgba(145,105,35,0.14)", display: "flex", alignItems: "center", gap: 6 }}>
                    <Identicon svg={identity.identicon} size={14} />
                    <span style={{ fontSize: 10, color: "rgba(100,62,12,0.38)" }}>
                      writing as <strong style={{ color: "rgba(100,62,12,0.58)" }}>{identity.name}</strong> · anonymous
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
