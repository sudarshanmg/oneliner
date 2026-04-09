import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createServerClient } from "@/lib/supabase/server";
import { buildTree, getCanonicalPath } from "@/lib/tree";
import type { Sentence } from "@/lib/supabase/types";

export async function GET() {
  const supabase = createServerClient();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Check cache
  const { data: cached } = await supabase
    .from("narrator_log")
    .select("*")
    .eq("date", today)
    .single();

  if (cached) {
    return NextResponse.json(cached);
  }

  // Fetch all sentences and find canonical path
  const { data: sentences } = await supabase
    .from("sentences")
    .select("*")
    .order("created_at", { ascending: true });

  if (!sentences || sentences.length === 0) {
    return NextResponse.json({ error: "No story yet." }, { status: 404 });
  }

  const { root } = buildTree(sentences as Sentence[]);
  const canonicalPath = getCanonicalPath(root);

  if (canonicalPath.length === 0) {
    return NextResponse.json({ error: "No canonical path." }, { status: 404 });
  }

  const storyText = canonicalPath.map((s, i) => `${i + 1}. ${s.body}`).join("\n");

  // Find best contributor by vote count on canonical path (excluding system)
  const bestContributor = canonicalPath
    .filter((s) => s.author_token !== "system")
    .sort((a, b) => b.votes - a.votes)[0];

  const contributorNote = bestContributor
    ? `The most celebrated contributor today is ${bestContributor.author_name}, whose line "${bestContributor.body.slice(0, 60)}…" earned the most recognition.`
    : "";

  // Generate with Groq (Llama 3.3 70B — free tier)
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 160,
    messages: [
      {
        role: "user",
        content: `You are a town crier living inside a story world. Write a single punchy 2-sentence in-universe bulletin about what happened today. Be vivid and dramatic. No preamble, no sign-off. ${contributorNote}

Story: ${storyText}`,
      },
    ],
  });

  const summary = completion.choices[0]?.message?.content ?? "";

  // Cache
  const { data: inserted } = await supabase
    .from("narrator_log")
    .insert({
      date: today,
      summary,
      canonical_path: canonicalPath,
    })
    .select()
    .single();

  return NextResponse.json(inserted);
}
