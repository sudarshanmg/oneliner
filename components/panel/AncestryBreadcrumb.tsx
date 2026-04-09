"use client";

import type { NodeWithPosition } from "@/lib/tree";

interface AncestryBreadcrumbProps {
  path: NodeWithPosition[];
  onSelect: (id: string) => void;
}

export function AncestryBreadcrumb({ path, onSelect }: AncestryBreadcrumbProps) {
  if (path.length <= 1) return null;

  const ancestors = path.slice(0, -1);

  return (
    <div className="flex flex-wrap gap-1 items-center text-[10px]">
      {ancestors.map((node, i) => (
        <span key={node.id} className="flex items-center gap-1">
          <button
            onClick={() => onSelect(node.id)}
            className="max-w-[110px] truncate font-medium transition-colors"
            title={node.body}
            style={{ color: "rgba(255,255,255,0.3)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ff6b35")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
          >
            {node.body.slice(0, 28)}…
          </button>
          {i < ancestors.length - 1 && (
            <span style={{ color: "rgba(255,255,255,0.15)" }}>›</span>
          )}
        </span>
      ))}
      <span style={{ color: "rgba(255,255,255,0.15)" }}>›</span>
      <span className="font-semibold" style={{ color: "#ff6b35" }}>this</span>
    </div>
  );
}
