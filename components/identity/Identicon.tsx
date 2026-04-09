"use client";

interface IdenticonProps {
  svg: string;
  size?: number;
  className?: string;
}

export function Identicon({ svg, size = 24, className = "" }: IdenticonProps) {
  return (
    <div
      className={`rounded-sm overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
