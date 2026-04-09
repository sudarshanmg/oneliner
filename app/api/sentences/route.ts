import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  try {
    const { parent_id, body, author_token, author_name } = await req.json();

    // Validate token
    if (!author_token || typeof author_token !== "string") {
      return NextResponse.json({ error: "Missing author token." }, { status: 400 });
    }

    // Validate body
    const trimmed = (body ?? "").trim();
    if (trimmed.length < 20) {
      return NextResponse.json({ error: "Sentence too short (min 20 chars)." }, { status: 400 });
    }
    if (trimmed.length > 280) {
      return NextResponse.json({ error: "Sentence too long (max 280 chars)." }, { status: 400 });
    }
    if (!/[.!?]$/.test(trimmed)) {
      return NextResponse.json({ error: "Sentence must end with punctuation." }, { status: 400 });
    }

    // Rate limit check (1 per hour, except system)
    if (author_token !== "system") {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("sentences")
        .select("*", { count: "exact", head: true })
        .eq("author_token", author_token)
        .gte("created_at", since);

      if (count && count > 0) {
        return NextResponse.json(
          { error: "You can only contribute once per hour." },
          { status: 429 }
        );
      }
    }

    // Validate parent exists (if provided)
    if (parent_id) {
      const { data: parentRow } = await supabase
        .from("sentences")
        .select("id")
        .eq("id", parent_id)
        .single();

      if (!parentRow) {
        return NextResponse.json({ error: "Parent sentence not found." }, { status: 404 });
      }
    }

    // Insert
    const { data, error } = await supabase
      .from("sentences")
      .insert({
        parent_id: parent_id ?? null,
        body: trimmed,
        author_token,
        author_name,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("POST /api/sentences error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

