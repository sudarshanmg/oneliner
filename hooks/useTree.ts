"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { buildTree, getCanonicalPath, type NodeWithPosition } from "@/lib/tree";
import type { Sentence } from "@/lib/supabase/types";

export function useTree() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [root, setRoot] = useState<NodeWithPosition | null>(null);
  const [nodeMap, setNodeMap] = useState<Map<string, NodeWithPosition>>(new Map());
  const [canonicalPath, setCanonicalPath] = useState<NodeWithPosition[]>([]);
  const [loading, setLoading] = useState(true);

  const rebuild = useCallback((data: Sentence[]) => {
    const { root, nodeMap } = buildTree(data);
    setRoot(root);
    setNodeMap(nodeMap);
    setCanonicalPath(getCanonicalPath(root));
  }, []);

  useEffect(() => {
    supabase
      .from("sentences")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        const list = data ?? [];
        setSentences(list);
        rebuild(list);
        setLoading(false);
      });
  }, [rebuild]);

  const addSentence = useCallback((sentence: Sentence) => {
    setSentences((prev) => {
      const next = [...prev, sentence];
      rebuild(next);
      return next;
    });
  }, [rebuild]);

  const updateVotes = useCallback((sentenceId: string, votes: number) => {
    setSentences((prev) => {
      const next = prev.map((s) => s.id === sentenceId ? { ...s, votes } : s);
      rebuild(next);
      return next;
    });
  }, [rebuild]);

  return { root, nodeMap, canonicalPath, loading, addSentence, updateVotes };
}
