"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

const HOUR_MS = 60 * 60 * 1000;

export function useCooldown(token: string | null) {
  const [msRemaining, setMsRemaining] = useState<number>(0);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    if (!token) return;
    setChecking(true);
    const since = new Date(Date.now() - HOUR_MS).toISOString();
    const { data } = await supabase
      .from("sentences")
      .select("created_at")
      .eq("author_token", token)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      const lastPost = new Date(data.created_at).getTime();
      const remaining = HOUR_MS - (Date.now() - lastPost);
      setMsRemaining(Math.max(0, remaining));
    } else {
      setMsRemaining(0);
    }
    setChecking(false);
  }, [token]);

  useEffect(() => {
    check();
  }, [check]);

  // Tick down every second
  useEffect(() => {
    if (msRemaining <= 0) return;
    const interval = setInterval(() => {
      setMsRemaining((prev) => {
        const next = prev - 1000;
        return next <= 0 ? 0 : next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [msRemaining]);

  const formatRemaining = () => {
    const total = Math.max(0, msRemaining);
    const minutes = Math.floor(total / 60000);
    const seconds = Math.floor((total % 60000) / 1000);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  return {
    onCooldown: msRemaining > 0,
    msRemaining,
    formatted: formatRemaining(),
    checking,
    refresh: check,
  };
}
