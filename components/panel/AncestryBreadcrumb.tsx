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
            className="text-[#8a8098] hover:text-[#ff6b35] transition-colors max-w-[110px] truncate font-medium"
            title={node.body}
          >
            {node.body.slice(0, 28)}…
          </button>
          {i < ancestors.length - 1 && <span className="text-[#c8bfa8]">›</span>}
        </span>
      ))}
      <span className="text-[#c8bfa8]">›</span>
      <span className="text-[#ff6b35] font-semibold">this</span>
    </div>
  );
}
