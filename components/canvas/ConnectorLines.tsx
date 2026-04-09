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

  // Approximate perpendicular at start and end of bezier
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

  // Four corners of the tapered shape
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
}

export function ConnectorLines({ nodeMap, nodePositions }: ConnectorLinesProps) {
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

  // Count children per node to scale trunk thickness
  const childCount = new Map<string, number>();
  for (const node of nodeMap.values()) {
    if (node.parent_id) {
      childCount.set(node.parent_id, (childCount.get(node.parent_id) ?? 0) + 1);
    }
  }

  const branches: React.ReactNode[] = [];

  for (const node of nodeMap.values()) {
    if (!node.parent_id) continue;
    const parent = nodeMap.get(node.parent_id);
    if (!parent) continue;

    const parentPos = getPos(parent.id, parent.x, parent.y);
    const childPos = getPos(node.id, node.x, node.y);

    // Start at bottom-center of parent, end at top-center of child (above pin)
    const x1 = parentPos.x + NODE_WIDTH / 2;
    const y1 = parentPos.y + NODE_HEIGHT + 16;
    const x2 = childPos.x + NODE_WIDTH / 2;
    const y2 = childPos.y - 20;

    // Thickness: thicker trunk when parent has many children
    const siblings = childCount.get(node.parent_id) ?? 1;
    const w1 = Math.min(14, 6 + siblings * 2);
    const w2 = 3;

    const path = taperingBranch(x1, y1, x2, y2, w1, w2);

    // Use a warm brown wood color
    branches.push(
      <g key={`${parent.id}-${node.id}`}>
        {/* Shadow/depth layer */}
        <path
          d={path}
          fill="rgba(0,0,0,0.06)"
          transform="translate(2,3)"
        />
        {/* Main branch */}
        <path
          d={path}
          fill="url(#branchGrad)"
        />
        {/* Highlight sheen */}
        <path
          d={path}
          fill="rgba(255,255,255,0.12)"
          style={{ mixBlendMode: "overlay" }}
        />
      </g>
    );
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
        <linearGradient id="branchGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a0723a" />
          <stop offset="60%" stopColor="#7a5528" />
          <stop offset="100%" stopColor="#5c3d18" />
        </linearGradient>
      </defs>
      <g transform={`translate(${-minX + padding}, ${-minY + padding})`}>
        {branches}
      </g>
    </svg>
  );
}
