"use client";

import type { NodeWithPosition } from "@/lib/tree";
import { NODE_WIDTH, NODE_HEIGHT } from "./SentenceNode";

// Tapered branch: thick at parent root, thin at child tip
function taperingBranch(
  x1: number, y1: number,
  x2: number, y2: number,
  w1: number, w2: number
): string {
  const cx1 = x1;
  const cy1 = (y1 + y2) / 2;
  const cx2 = x2;
  const cy2 = (y1 + y2) / 2;

  const dxStart = cx1 - x1;
  const dyStart = cy1 - y1;
  const lenStart = Math.sqrt(dxStart * dxStart + dyStart * dyStart) || 1;
  const pxStart = -dyStart / lenStart;
  const pyStart = dxStart / lenStart;

  const dxEnd = x2 - cx2;
  const dyEnd = y2 - cy2;
  const lenEnd = Math.sqrt(dxEnd * dxEnd + dyEnd * dyEnd) || 1;
  const pxEnd = -dyEnd / lenEnd;
  const pyEnd = dxEnd / lenEnd;

  const lx1 = x1 + pxStart * w1 / 2,  ly1 = y1 + pyStart * w1 / 2;
  const rx1 = x1 - pxStart * w1 / 2,  ry1 = y1 - pyStart * w1 / 2;
  const lx2 = x2 + pxEnd * w2 / 2,    ly2 = y2 + pyEnd * w2 / 2;
  const rx2 = x2 - pxEnd * w2 / 2,    ry2 = y2 - pyEnd * w2 / 2;

  return [
    `M ${lx1} ${ly1}`,
    `C ${cx1 + pxStart * w1 / 2} ${cy1 + pyStart * w1 / 2}, ${cx2 + pxEnd * w2 / 2} ${cy2 + pyEnd * w2 / 2}, ${lx2} ${ly2}`,
    `L ${rx2} ${ry2}`,
    `C ${cx2 - pxEnd * w2 / 2} ${cy2 - pyEnd * w2 / 2}, ${cx1 - pxStart * w1 / 2} ${cy1 - pyStart * w1 / 2}, ${rx1} ${ry1}`,
    `Z`,
  ].join(" ");
}

import type { NodePositions } from "./WorldCanvas";

interface ConnectorLinesProps {
  nodeMap: Map<string, NodeWithPosition>;
  nodePositions: NodePositions;
  canonicalIds: Set<string>;
}

export function ConnectorLines({ nodeMap, nodePositions, canonicalIds }: ConnectorLinesProps) {
  if (nodeMap.size === 0) return null;

  const getPos = (id: string, fallbackX: number, fallbackY: number) =>
    nodePositions.get(id) ?? { x: fallbackX, y: fallbackY };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of nodeMap.values()) {
    const pos = getPos(node.id, node.x, node.y);
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + NODE_WIDTH);
    maxY = Math.max(maxY, pos.y + NODE_HEIGHT);
  }

  // Count children per node for trunk thickness
  const childCount = new Map<string, number>();
  // Max votes among siblings for relative intensity
  const maxSiblingVotes = new Map<string, number>();

  for (const node of nodeMap.values()) {
    if (node.parent_id) {
      childCount.set(node.parent_id, (childCount.get(node.parent_id) ?? 0) + 1);
      const prev = maxSiblingVotes.get(node.parent_id) ?? 0;
      maxSiblingVotes.set(node.parent_id, Math.max(prev, node.votes));
    }
  }

  // Draw non-canonical first, canonical on top
  const regularBranches: React.ReactNode[] = [];
  const canonicalBranches: React.ReactNode[] = [];

  for (const node of nodeMap.values()) {
    if (!node.parent_id) continue;
    const parent = nodeMap.get(node.parent_id);
    if (!parent) continue;

    const parentPos = getPos(parent.id, parent.x, parent.y);
    const childPos = getPos(node.id, node.x, node.y);

    const x1 = parentPos.x + NODE_WIDTH / 2;
    const y1 = parentPos.y + NODE_HEIGHT + 16;
    const x2 = childPos.x + NODE_WIDTH / 2;
    const y2 = childPos.y - 20;

    const siblings = childCount.get(node.parent_id) ?? 1;
    const isCanonical = canonicalIds.has(node.id) && canonicalIds.has(node.parent_id);
    const maxVotes = maxSiblingVotes.get(node.parent_id) ?? 0;

    // Thickness: canonical is thicker; also slightly thicker for more-voted non-canonical
    const baseW1 = Math.min(14, 6 + siblings * 2);
    const w1 = isCanonical ? Math.min(18, baseW1 + 4) : baseW1;
    const w2 = isCanonical ? 5 : 3;

    const path = taperingBranch(x1, y1, x2, y2, w1, w2);

    // Opacity for non-canonical: dim if 0 votes, brighter with votes
    const voteRatio = maxVotes > 0 ? node.votes / maxVotes : 0;
    const dimOpacity = 0.35 + voteRatio * 0.35; // 0.35 → 0.7

    if (isCanonical) {
      canonicalBranches.push(
        <g key={`${parent.id}-${node.id}`}>
          {/* Glow halo */}
          <path d={path} fill="rgba(245,158,11,0.25)" filter="url(#canonicalGlow)" />
          {/* Shadow */}
          <path d={path} fill="rgba(0,0,0,0.10)" transform="translate(2,4)" />
          {/* Main golden branch */}
          <path d={path} fill="url(#canonicalGrad)" />
          {/* Sheen */}
          <path d={path} fill="rgba(255,255,255,0.18)" style={{ mixBlendMode: "overlay" }} />
        </g>
      );
    } else {
      regularBranches.push(
        <g key={`${parent.id}-${node.id}`} opacity={dimOpacity}>
          {/* Shadow */}
          <path d={path} fill="rgba(0,0,0,0.05)" transform="translate(2,3)" />
          {/* Main brown branch */}
          <path d={path} fill="url(#branchGrad)" />
          {/* Sheen */}
          <path d={path} fill="rgba(255,255,255,0.08)" style={{ mixBlendMode: "overlay" }} />
        </g>
      );
    }
  }

  const padding = 200;
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;

  return (
    <svg
      style={{
        position: "absolute",
        left: minX - padding,
        top: minY - padding,
        width,
        height,
        pointerEvents: "none",
        overflow: "visible",
        zIndex: 0,
      }}
    >
      <defs>
        {/* Regular brown branch */}
        <linearGradient id="branchGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a0723a" />
          <stop offset="60%" stopColor="#7a5528" />
          <stop offset="100%" stopColor="#5c3d18" />
        </linearGradient>

        {/* Canonical amber/gold branch */}
        <linearGradient id="canonicalGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#e07b10" />
          <stop offset="100%" stopColor="#b85a00" />
        </linearGradient>

        {/* Glow filter for canonical */}
        <filter id="canonicalGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <g transform={`translate(${-minX + padding}, ${-minY + padding})`}>
        {/* Dim branches under the canonical */}
        {regularBranches}
        {/* Canonical path on top, glowing */}
        {canonicalBranches}
      </g>
    </svg>
  );
}
