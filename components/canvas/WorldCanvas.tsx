"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Crosshair } from "lucide-react";
import { motion } from "framer-motion";
import { SentenceNode, NODE_WIDTH, NODE_HEIGHT } from "./SentenceNode";
import { ConnectorLines } from "./ConnectorLines";
import type { NodeWithPosition } from "@/lib/tree";
import { getCanonicalPath } from "@/lib/tree";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 2.5;
const DEFAULT_ZOOM = 0.85;

export type NodePositions = Map<string, { x: number; y: number }>;

interface WorldCanvasProps {
  nodeMap: Map<string, NodeWithPosition>;
  root: NodeWithPosition | null;
  selectedId: string | null;
  userToken: string | null;
  newNodeIds: Set<string>;
  centerKey: number;
  onSelectNode: (id: string) => void;
  onBranchNode: (id: string) => void;
  onVote: (id: string) => void;
}

export function WorldCanvas({
  nodeMap,
  root,
  selectedId,
  userToken,
  newNodeIds,
  centerKey,
  onSelectNode,
  onBranchNode,
  onVote,
}: WorldCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const zoomRef = useRef(DEFAULT_ZOOM);
  const canvasDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const [nodePositions, setNodePositions] = useState<NodePositions>(new Map());

  useEffect(() => {
    setNodePositions((prev) => {
      const next = new Map(prev);
      let changed = false;
      for (const node of nodeMap.values()) {
        if (!next.has(node.id)) {
          next.set(node.id, { x: node.x, y: node.y });
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [nodeMap]);

  const getPosForNode = useCallback((id: string, fallbackX: number, fallbackY: number) => {
    return nodePositions.get(id) ?? { x: fallbackX, y: fallbackY };
  }, [nodePositions]);

  const handleNodeMove = useCallback((id: string, x: number, y: number) => {
    setNodePositions((prev) => new Map(prev).set(id, { x, y }));
  }, []);

  const centerOnRoot = useCallback(() => {
    if (!root || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = nodePositions.get(root.id) ?? { x: root.x, y: root.y };
    setPan({
      x: rect.width / 2 - (pos.x + NODE_WIDTH / 2) * DEFAULT_ZOOM,
      y: rect.height / 3 - (pos.y + NODE_HEIGHT / 2) * DEFAULT_ZOOM,
    });
    setZoom(DEFAULT_ZOOM);
    zoomRef.current = DEFAULT_ZOOM;
  }, [root, nodePositions]);

  useEffect(() => { centerOnRoot(); }, [centerKey]); // eslint-disable-line

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    canvasDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  }, []);

  const onMouseUp = useCallback(() => { canvasDragging.current = false; }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current * factor));
    zoomRef.current = newZoom;
    setPan((p) => ({
      x: mouseX - (mouseX - p.x) * (newZoom / (zoomRef.current / factor)),
      y: mouseY - (mouseY - p.y) * (newZoom / (zoomRef.current / factor)),
    }));
    setZoom(newZoom);
  }, []);

  const canonicalIds = new Set(getCanonicalPath(root).map((n) => n.id));

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden select-none relative"
      style={{
        cursor: canvasDragging.current ? "grabbing" : "default",
        backgroundColor: "#060410",
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)",
        backgroundSize: "30px 30px",
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
    >
      {/* Aurora blobs — fixed, don't move with pan/zoom */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="aurora-a absolute rounded-full"
          style={{
            width: "70vw",
            height: "60vh",
            top: "-20vh",
            left: "-15vw",
            background: "radial-gradient(ellipse, rgba(255,107,53,0.07) 0%, transparent 65%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="aurora-b absolute rounded-full"
          style={{
            width: "60vw",
            height: "55vh",
            bottom: "-20vh",
            right: "-10vw",
            background: "radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 65%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="aurora-c absolute rounded-full"
          style={{
            width: "50vw",
            height: "45vh",
            top: "35%",
            left: "25%",
            background: "radial-gradient(ellipse, rgba(16,185,129,0.05) 0%, transparent 65%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* Panning / zooming world */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          position: "relative",
          willChange: "transform",
        }}
      >
        <ConnectorLines
          nodeMap={nodeMap}
          nodePositions={nodePositions}
          canonicalIds={canonicalIds}
        />

        {Array.from(nodeMap.values()).map((node) => {
          const pos = getPosForNode(node.id, node.x, node.y);
          return (
            <SentenceNode
              key={node.id}
              node={node}
              posX={pos.x}
              posY={pos.y}
              zoom={zoom}
              isSelected={selectedId === node.id}
              isOwn={node.author_token === userToken}
              isNew={newNodeIds.has(node.id)}
              onSelect={() => onSelectNode(node.id)}
              onBranch={() => onBranchNode(node.id)}
              onVote={() => onVote(node.id)}
              onMove={(x, y) => handleNodeMove(node.id, x, y)}
            />
          );
        })}
      </div>

      {/* Recenter */}
      {nodeMap.size > 0 && (
        <motion.button
          onClick={centerOnRoot}
          whileHover={{ scale: 1.08, y: -1 }}
          whileTap={{ scale: 0.94 }}
          className="absolute bottom-5 right-5 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          }}
        >
          <Crosshair size={13} />
          Recenter
        </motion.button>
      )}
    </div>
  );
}
