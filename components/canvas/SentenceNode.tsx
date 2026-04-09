"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Feather, Heart, GripVertical } from "lucide-react";
import { Identicon } from "@/components/identity/Identicon";
import { generateIdenticon } from "@/lib/identity";
import type { NodeWithPosition } from "@/lib/tree";

export const NODE_WIDTH = 230;
export const NODE_HEIGHT = 210;

const PALETTE = [
  { bg: "#FFDE5C", pin: "#e6c400", text: "#2d2400" },
  { bg: "#FF9D6C", pin: "#e06030", text: "#2d1000" },
  { bg: "#FF7EB3", pin: "#d0408a", text: "#2d0020" },
  { bg: "#B4A0FF", pin: "#7050d0", text: "#140040" },
  { bg: "#6DD5C3", pin: "#30a898", text: "#003028" },
  { bg: "#6BB8FF", pin: "#2878d0", text: "#001840" },
  { bg: "#A8E063", pin: "#60a820", text: "#102000" },
];

function nodeColor(id: string) {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h) ^ id.charCodeAt(i);
  return PALETTE[(h >>> 0) % PALETTE.length];
}

function nodeRotation(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (((h >>> 0) % 15) - 7) * 0.5;
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
  const rotate = nodeRotation(node.id);

  const [hovered, setHovered] = useState(false);
  const [liking, setLiking] = useState(false);
  const [floaters, setFloaters] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Drag tracking via raw mouse events so it doesn't interfere with canvas pan
  const dragStart = useRef({ mx: 0, my: 0, nx: 0, ny: 0 });
  const wasDragged = useRef(false);

  const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // prevent canvas pan
    e.preventDefault();
    wasDragged.current = false;
    dragStart.current = { mx: e.clientX, my: e.clientY, nx: posX, ny: posY };
    setIsDragging(true);

    const onMouseMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - dragStart.current.mx) / zoom;
      const dy = (ev.clientY - dragStart.current.my) / zoom;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) wasDragged.current = true;
      onMove(dragStart.current.nx + dx, dragStart.current.ny + dy);
    };

    const onUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onUp);
  }, [posX, posY, zoom, onMove]);

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

  const showActions = hovered && !isDragging;

  return (
    // Outer wrapper covers card + button area — hover state tracks the whole region
    <div
      data-node="true"
      style={{
        position: "absolute",
        left: posX,
        top: posY,
        width: NODE_WIDTH,
        // Tall enough to include the action row below
        paddingBottom: 52,
        zIndex: isDragging ? 200 : isSelected ? 20 : hovered ? 100 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Animated card */}
      <motion.div
        initial={isNew ? { scale: 0, rotate: rotate - 10, opacity: 0, y: -20 } : false}
        animate={{
          scale: isSelected ? 1.06 : isDragging ? 1.04 : 1,
          rotate: isSelected || isDragging ? 0 : rotate,
          opacity: 1,
          y: 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{
          position: "relative",
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onClick={handleClick}
        onMouseDown={handleDragMouseDown}
      >
        {/* Push pin */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-4 z-10 flex flex-col items-center pointer-events-none"
        >
          <div
            className="w-5 h-5 rounded-full shadow-md border-2 border-white"
            style={{ background: isOwn ? "#ff6b35" : color.pin }}
          />
          <div className="w-0.5 h-3" style={{ background: color.pin + "88" }} />
        </div>

        {/* New pulse */}
        {isNew && (
          <motion.div
            initial={{ scale: 1, opacity: 0.7 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ border: `3px solid ${color.bg}` }}
          />
        )}

        {/* Card body */}
        <div
          className="rounded-2xl flex flex-col overflow-hidden"
          style={{
            background: color.bg,
            boxShadow: isSelected
              ? `0 0 0 3px #1a1530, 0 16px 48px rgba(0,0,0,0.22)`
              : isDragging
              ? `0 20px 60px rgba(0,0,0,0.25)`
              : `0 6px 24px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.06)`,
            minHeight: NODE_HEIGHT,
          }}
        >
          {/* Drag grip + own badge */}
          <div className="flex items-center justify-between px-3 pt-2 pointer-events-none">
            <GripVertical size={12} style={{ color: color.text + "44" }} />
            {isOwn && (
              <span
                className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(0,0,0,0.12)", color: color.text }}
              >
                you
              </span>
            )}
          </div>

          {/* Text */}
          <div className="px-4 pb-3 flex-1">
            <p
              className="text-[13px] leading-[1.7]"
              style={{
                fontFamily: "var(--font-lora), Georgia, serif",
                color: color.text,
                fontWeight: 500,
              }}
            >
              {node.body}
            </p>
          </div>

          {/* Footer */}
          <div
            className="px-4 py-2.5 flex items-center justify-between"
            style={{ borderTop: `1px solid rgba(0,0,0,0.07)` }}
          >
            <div className="flex items-center gap-1.5 min-w-0 pointer-events-none">
              <Identicon svg={identicon} size={14} />
              <span className="text-[10px] font-semibold truncate max-w-[80px]" style={{ color: color.text + "aa" }}>
                {node.author_name}
              </span>
              <span className="text-[9px]" style={{ color: color.text + "55" }}>
                · {timeAgo(node.created_at)}
              </span>
            </div>
            {node.votes > 0 && (
              <div className="flex items-center gap-0.5 text-[10px] font-bold pointer-events-none" style={{ color: color.text + "88" }}>
                <Heart size={9} fill="currentColor" />
                {node.votes}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Action buttons — INSIDE the wrapper so hover state is preserved */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="flex items-center justify-center gap-2 mt-2"
          >
            {/* Like */}
            <motion.button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleVote}
              whileTap={{ scale: 0.85 }}
              animate={liking ? { scale: [1, 1.5, 0.9, 1.15, 1] } : { scale: 1 }}
              transition={{ duration: 0.4 }}
              className="relative flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-full shadow-md"
              style={{ background: "#fff", color: "#5a5070", border: "1.5px solid #e0d9c8" }}
            >
              <Heart size={11} fill={node.votes > 0 ? "#ff6b35" : "none"} stroke={node.votes > 0 ? "#ff6b35" : "currentColor"} />
              {node.votes > 0 ? node.votes : "Like"}

              <AnimatePresence>
                {floaters.map((k) => (
                  <motion.span
                    key={k}
                    initial={{ opacity: 1, y: 0, x: "-50%" }}
                    animate={{ opacity: 0, y: -30, x: "-50%" }}
                    exit={{}}
                    transition={{ duration: 0.7 }}
                    onAnimationComplete={() => setFloaters((f) => f.filter((x) => x !== k))}
                    className="absolute -top-6 left-1/2 text-xs font-black pointer-events-none text-[#ff6b35] whitespace-nowrap"
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
              whileHover={{ scale: 1.06, y: -1 }}
              whileTap={{ scale: 0.93 }}
              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md"
              style={{
                background: "linear-gradient(135deg, #ff6b35, #f59e0b)",
                color: "#fff",
                boxShadow: "0 3px 12px rgba(255,107,53,0.4)",
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
