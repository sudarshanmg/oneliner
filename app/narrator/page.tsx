export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, Scroll } from "lucide-react";
import { createServerClient } from "@/lib/supabase/server";
import type { NarratorLog } from "@/lib/supabase/types";

async function getLogs(): Promise<NarratorLog[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("narrator_log")
    .select("*")
    .order("date", { ascending: false });
  return data ?? [];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function NarratorPage() {
  const logs = await getLogs();
  const today = new Date().toISOString().split("T")[0];
  const todaysLog = logs.find((l) => l.date === today);
  const pastLogs = logs.filter((l) => l.date !== today);

  return (
    <div className="min-h-screen" style={{ background: "#fdf8f0" }}>
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center gap-3 sticky top-0 z-10"
        style={{ background: "#fff", borderBottom: "1.5px solid #e0d9c8" }}
      >
        <Link
          href="/"
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-[#f7f3e9] text-[#8a8098] hover:text-[#1a1530]"
        >
          <ArrowLeft size={15} />
        </Link>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: "#fff4d6", border: "1.5px solid #f59e0b40" }}
          >
            <Scroll size={13} className="text-[#f59e0b]" />
          </div>
          <h1 className="text-sm font-bold text-[#1a1530]">World Chronicle</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">
        {todaysLog ? (
          <TodaysBroadcast log={todaysLog} />
        ) : (
          <GeneratePrompt />
        )}

        {pastLogs.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-[10px] text-[#c8bfa8] uppercase tracking-widest font-semibold">
              Past Chronicles
            </h2>
            {pastLogs.map((log) => (
              <PastBroadcast key={log.id} log={log} />
            ))}
          </div>
        )}

        {logs.length === 0 && (
          <div className="text-center py-20">
            <Scroll size={28} className="text-[#e0d9c8] mx-auto mb-3" />
            <p className="text-[#8a8098] text-sm" style={{ fontFamily: "var(--font-lora), Georgia, serif" }}>
              The chronicle has not yet been written.
            </p>
            <a
              href="/api/narrator"
              className="inline-block mt-3 text-xs font-semibold text-[#f59e0b] hover:text-[#ff6b35] transition-colors border border-[#f59e0b40] hover:border-[#ff6b35] px-3 py-1.5 rounded-xl"
            >
              Generate today&apos;s chronicle →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function TodaysBroadcast({ log }: { log: NarratorLog }) {
  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-16" style={{ background: "linear-gradient(to right, transparent, #f59e0b60)" }} />
          <span className="text-[#f59e0b] text-[10px] uppercase tracking-widest font-bold">
            Today&apos;s Chronicle
          </span>
          <div className="h-px w-16" style={{ background: "linear-gradient(to left, transparent, #f59e0b60)" }} />
        </div>
        <p className="text-[11px] text-[#c8bfa8]">{formatDate(log.date)}</p>
      </div>

      <div
        className="rounded-3xl p-7 space-y-4 shadow-lg"
        style={{
          background: "#fffcf0",
          border: "1.5px solid #f0e5c0",
          boxShadow: "0 8px 40px rgba(245,158,11,0.08)",
        }}
      >
        {log.summary.split("\n\n").filter(Boolean).map((para, i) => (
          <p
            key={i}
            className="text-[15px] leading-[1.85] text-[#3d3020]"
            style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
          >
            {para}
          </p>
        ))}
      </div>

      {Array.isArray(log.canonical_path) && log.canonical_path.length > 0 && (
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: "#fff", border: "1.5px solid #e0d9c8" }}
        >
          <p className="text-[10px] text-[#c8bfa8] uppercase tracking-widest font-semibold">
            The canonical thread
          </p>
          <div className="space-y-2">
            {(log.canonical_path as Array<{ body: string; author_name: string }>).map((s, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="text-[10px] text-[#e0d9c8] font-mono mt-1 w-4 flex-shrink-0 font-bold">
                  {i + 1}
                </span>
                <p
                  className="text-xs text-[#5a5070] leading-relaxed"
                  style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
                >
                  {s.body}
                  <span className="text-[#c8bfa8] ml-2">— {s.author_name}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PastBroadcast({ log }: { log: NarratorLog }) {
  return (
    <div className="border-l-2 border-[#e0d9c8] pl-4 space-y-2">
      <p className="text-[10px] text-[#c8bfa8] font-semibold">{formatDate(log.date)}</p>
      <div className="space-y-2">
        {log.summary.split("\n\n").filter(Boolean).map((para, i) => (
          <p
            key={i}
            className="text-sm leading-[1.7] text-[#8a8098]"
            style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
          >
            {para}
          </p>
        ))}
      </div>
    </div>
  );
}

function GeneratePrompt() {
  return (
    <div className="text-center py-12 space-y-4">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
        style={{ background: "#fff4d6", border: "1.5px solid #f59e0b30" }}
      >
        <Scroll size={22} className="text-[#f59e0b]" />
      </div>
      <p className="text-[#5a5070] text-sm" style={{ fontFamily: "var(--font-lora), Georgia, serif" }}>
        Today&apos;s chronicle has not yet been written.
      </p>
      <a
        href="/api/narrator"
        className="inline-block text-xs font-bold text-white px-4 py-2 rounded-xl transition-all hover:shadow-md"
        style={{ background: "linear-gradient(135deg, #f59e0b, #ff6b35)" }}
      >
        Generate today&apos;s chronicle →
      </a>
    </div>
  );
}
