import type { Sentence } from "./supabase/types";

export type NodeWithPosition = Sentence & {
  x: number;
  y: number;
  children: NodeWithPosition[];
};

const NODE_WIDTH = 230;
const NODE_HEIGHT = 210;
const H_GAP = 60;
const V_GAP = 120; // extra room for the branch stems + pin above each card

export function buildTree(sentences: Sentence[]): {
  root: NodeWithPosition | null;
  nodeMap: Map<string, NodeWithPosition>;
} {
  if (sentences.length === 0) return { root: null, nodeMap: new Map() };

  const nodeMap = new Map<string, NodeWithPosition>();

  // Initialize all nodes
  for (const s of sentences) {
    nodeMap.set(s.id, { ...s, x: 0, y: 0, children: [] });
  }

  // Build parent-child relationships
  let root: NodeWithPosition | null = null;
  for (const node of nodeMap.values()) {
    if (node.parent_id === null) {
      root = node;
    } else {
      const parent = nodeMap.get(node.parent_id);
      if (parent) {
        parent.children.push(node);
      }
    }
  }

  if (!root) return { root: null, nodeMap };

  // Sort children by created_at
  for (const node of nodeMap.values()) {
    node.children.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  // Layout: measure subtree widths, then assign positions
  function measureWidth(node: NodeWithPosition): number {
    if (node.children.length === 0) return NODE_WIDTH;
    const childrenWidth = node.children.reduce(
      (sum, child) => sum + measureWidth(child) + H_GAP,
      -H_GAP
    );
    return Math.max(NODE_WIDTH, childrenWidth);
  }

  function layout(node: NodeWithPosition, x: number, y: number) {
    node.x = x;
    node.y = y;

    if (node.children.length === 0) return;

    const totalWidth = node.children.reduce(
      (sum, child) => sum + measureWidth(child) + H_GAP,
      -H_GAP
    );
    let childX = x - totalWidth / 2;

    for (const child of node.children) {
      const childWidth = measureWidth(child);
      layout(child, childX + childWidth / 2, y + NODE_HEIGHT + V_GAP);
      childX += childWidth + H_GAP;
    }
  }

  layout(root, 0, 0);

  return { root, nodeMap };
}

export function getCanonicalPath(root: NodeWithPosition | null): NodeWithPosition[] {
  if (!root) return [];

  const path: NodeWithPosition[] = [root];
  let current = root;

  while (current.children.length > 0) {
    // Pick child with highest votes, ties broken by oldest
    const best = current.children.reduce((prev, curr) => {
      if (curr.votes > prev.votes) return curr;
      if (curr.votes === prev.votes) {
        return new Date(curr.created_at) < new Date(prev.created_at) ? curr : prev;
      }
      return prev;
    });
    path.push(best);
    current = best;
  }

  return path;
}

export function getAncestry(nodeId: string, nodeMap: Map<string, NodeWithPosition>): NodeWithPosition[] {
  const path: NodeWithPosition[] = [];
  let current = nodeMap.get(nodeId);

  while (current) {
    path.unshift(current);
    current = current.parent_id ? nodeMap.get(current.parent_id) : undefined;
  }

  return path;
}
