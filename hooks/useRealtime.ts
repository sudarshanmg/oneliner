"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Sentence } from "@/lib/supabase/types";

export function useRealtime(onInsert: (sentence: Sentence) => void) {
  useEffect(() => {
    const channel = supabase
      .channel("sentences-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sentences" },
        (payload) => {
          onInsert(payload.new as Sentence);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onInsert]);
}
