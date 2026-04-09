"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Feather, Heart } from "lucide-react";
import { Identicon } from "@/components/identity/Identicon";
import { generateIdenticon } from "@/lib/identity";
import type { NodeWithPosition } from "@/lib/tree";

export const NODE_WIDTH = 230;
export const NODE_HEIGHT = 210;

const PALETTE = [
  { glow: "#FFDE5C", pin: "#e6c400", text: "#fff" },
  { glow: "#FF9D6C", pin: "#e06030", text: "#fff" },
  { glow: "#FF7EB3", pin: "#d0408a", text: "#fff" },
  { glow: "#B4A0FF", pin: "#7050d0", text: "#fff" },
  { glow: "#6DD5C3", pin: "#30a898", text: "#fff" },
  { glow: "#6BB8FF", pin: "#2878d0", text: "#fff" },
  { glow: "#A8E063", pin: "#60a820", text: "#fff" },
];

function nodeColor(id: string) {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h) ^ id.charCodeAt(i);
  return PALETTE[(h >>> 0) % PALETTE.length];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface SentenceNodeProps {
  node: NodeWithPosition;
  posX: number;
  posY: number;
  zoom: number;
  isSelected: boolean;
  isOwn: boolean;
  isNew?: boolean;
  onSelect: () => void;
  onBranch: () => void;
  onVote: () => void;
  onMove: (x: number, y: number) => void;
}

export function SentenceNode({
  node,
  posX,
  posY,
  zoom,
  isSelected,
  isOwn,
  isNew = false,
  onSelect,
  onBranch,
  onVote,
  onMove,
}: SentenceNodeProps) {
  const identicon = generateIdenticon(node.author_token);
  const color = nodeColor(node.id);

  const [hovered, setHovered] = useState(false);
  const [liking, setLiking] = useState(false);
  const [floaters, setFloaters] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // 3D tilt via mouse position
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const rotateX = useTransform(rotX, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(rotY, [-0.5, 0.5], [-8, 8]);

  // Drag tracking
  const dragStart = useRef({ mx: 0, my: 0, nx: 0, ny: 0 });
  const wasDragged = useRef(false);
  const isDraggingRef = useRef(false);

  const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    wasDragged.current = false;
    dragStart.current = { mx: e.clientX, my: e.clientY, nx: posX, ny: posY };
    isDraggingRef.current = true;
    setIsDragging(true);

    const onMouseMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - dragStart.current.mx) / zoom;
      const dy = (ev.clientY - dragStart.current.my) / zoom;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) wasDragged.current = true;
      onMove(dragStart.current.nx + dx, dragStart.current.ny + dy);
    };

    const onUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      rotX.set(0);
      rotY.set(0);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onUp);
  }, [posX, posY, zoom, onMove, rotX, rotY]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (wasDragged.current) { wasDragged.current = false; return; }
    e.stopPropagation();
    onSelect();
  }, [onSelect]);

  const handleVote = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setLiking(true);
    setFloaters((f) => [...f, Date.now()]);
    onVote();
    setTimeout(() => setLiking(false), 500);
  }, [onVote]);

  const handleBranch = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onBranch();
  }, [onBranch]);

  const handleTiltMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    rotX.set((e.clientY - rect.top) / rect.height - 0.5);
    rotY.set((e.clientX - rect.left) / rect.width - 0.5);
  }, [rotX, rotY]);

  const resetTilt = useCallback(() => {
    rotX.set(0);
    rotY.set(0);
  }, [rotX, rotY]);

  const showActions = hovered && !isDragging;

  // Glow intensity based on votes
  const glowOpacity = Math.min(0.5, 0.15 + node.votes * 0.05);

  return (
    <div
      data-node="true"
      style={{
        position: "absolute",
        left: posX,
        top: posY,
        width: NODE_WIDTH,
        paddingBottom: 56,
        zIndex: isDragging ? 200 : isSelected ? 20 : hovered ? 100 : 1,
        perspective: "600px",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); resetTilt(); }}
    >
      {/* Ambient glow behind card */}
      <div
        style={{
          position: "absolute",
          inset: -20,
          borderRadius: 32,
          background: `radial-gradient(ellipse at center, ${color.glow}${Math.round(glowOpacity * 255).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
          pointerEvents: "none",
          transition: "opacity 0.3s",
          opacity: hovered || isSelected ? 1 : 0.6,
          filter: "blur(8px)",
        }}
      />

      {/* 3D tilting card */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          cursor: isDragging ? "grabbing" : "grab",
        }}
        initial={isNew ? { scale: 0, opacity: 0, y: -30 } : false}
        animate={{
          scale: isSelected ? 1.05 : isDragging ? 1.03 : 1,
          opacity: 1,
          y: 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        onMouseMove={handleTiltMove}
        onClick={handleClick}
        onMouseDown={handleDragMouseDown}
      >
        {/* Push pin */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-4 z-10 flex flex-col items-center pointer-events-none">
          <motion.div
            animate={isNew ? { scale: [1, 1.4, 1] } : {}}
            transition={{ duration: 0.4 }}
            className="w-5 h-5 rounded-full border-2 shadow-lg"
            style={{
              background: isOwn
                ? "linear-gradient(135deg, #ff6b35, #f59e0b)"
                : color.glow,
              borderColor: "rgba(255,255,255,0.2)",
              boxShadow: `0 0 12px ${color.glow}80`,
            }}
          />
          <div
            className="w-0.5 h-3"
            style={{ background: `linear-gradient(to bottom, ${color.glow}88, transparent)` }}
          />
        </div>

        {/* Pulse ring for new nodes */}
        {isNew && (
          <motion.div
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ border: `2px solid ${color.glow}` }}
          />
        )}

        {/* Card body */}
        <div
          className="rounded-2xl flex flex-col overflow-hidden"
          style={{
            background: "rgba(8, 6, 22, 0.88)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${color.glow}40`,
            boxShadow: isSelected
              ? `0 0 0 2px ${color.glow}, 0 24px 64px rgba(0,0,0,0.8), 0 0 80px ${color.glow}30, inset 0 1px 0 rgba(255,255,255,0.1)`
              : isDragging
              ? `0 24px 64px rgba(0,0,0,0.7), 0 0 50px ${color.glow}20, inset 0 1px 0 rgba(255,255,255,0.08)`
              : `0 0 0 1px ${color.glow}20, 0 8px 32px rgba(0,0,0,0.6), 0 0 50px ${color.glow}10, inset 0 1px 0 rgba(255,255,255,0.06)`,
            minHeight: NODE_HEIGHT,
          }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-3 pt-2.5 pointer-events-none">
            <div className="flex gap-0.5">
              <div className="w-2 h-2 rounded-full" style={{ background: `${color.glow}60` }} />
              <div className="w-2 h-2 rounded-full" style={{ background: `${color.glow}30` }} />
              <div className="w-2 h-2 rounded-full" style={{ background: `${color.glow}15` }} />
            </div>
            {isOwn && (
              <span
                className="text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                style={{
                  background: `${color.glow}20`,
                  color: color.glow,
                  border: `1px solid ${color.glow}40`,
                }}
              >
                you
              </span>
            )}
          </div>

          {/* Text */}
          <div className="px-4 pb-3 pt-2 flex-1">
            <p
              className="text-[13px] leading-[1.75]"
              style={{
                fontFamily: "var(--font-lora), Georgia, serif",
                color: "rgba(255,255,255,0.92)",
                fontWeight: 400,
              }}
            >
              {node.body}
            </p>
          </div>

          {/* Footer */}
          <div
            className="px-4 py-2.5 flex items-center justify-between"
            style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}
          >
            <div className="flex items-center gap-1.5 min-w-0 pointer-events-none">
              <Identicon svg={identicon} size={14} />
              <span
                className="text-[10px] font-semibold truncate max-w-[80px]"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                {node.author_name}
              </span>
              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                · {timeAgo(node.created_at)}
              </span>
            </div>
            {node.votes > 0 && (
              <div
                className="flex items-center gap-0.5 text-[10px] font-bold pointer-events-none"
                style={{ color: color.glow }}
              >
                <Heart size={9} fill="currentColor" />
                {node.votes}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Action buttons */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center gap-2 mt-2.5"
          >
            {/* Like */}
            <motion.button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleVote}
              whileHover={{ scale: 1.08, y: -1 }}
              whileTap={{ scale: 0.88 }}
              animate={liking ? { scale: [1, 1.5, 0.9, 1.15, 1] } : { scale: 1 }}
              transition={{ duration: 0.4 }}
              className="relative flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(12px)",
              }}
            >
              <Heart
                size={11}
                fill={node.votes > 0 ? color.glow : "none"}
                stroke={node.votes > 0 ? color.glow : "currentColor"}
              />
              {node.votes > 0 ? node.votes : "Like"}

              <AnimatePresence>
                {floaters.map((k) => (
                  <motion.span
                    key={k}
                    initial={{ opacity: 1, y: 0, x: "-50%" }}
                    animate={{ opacity: 0, y: -32, x: "-50%" }}
                    exit={{}}
                    transition={{ duration: 0.7 }}
                    onAnimationComplete={() => setFloaters((f) => f.filter((x) => x !== k))}
                    className="absolute -top-7 left-1/2 text-xs font-black pointer-events-none whitespace-nowrap"
                    style={{ color: color.glow }}
                  >
                    +1 ♥
                  </motion.span>
                ))}
              </AnimatePresence>
            </motion.button>

            {/* Branch */}
            <motion.button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleBranch}
              whileHover={{ scale: 1.08, y: -1 }}
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full"
              style={{
                background: "linear-gradient(135deg, #ff6b35, #f59e0b)",
                color: "#fff",
                boxShadow: "0 4px 16px rgba(255,107,53,0.5)",
              }}
            >
              <Feather size={11} />
              Continue →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
