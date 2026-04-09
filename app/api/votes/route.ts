import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  try {
    const { sentence_id, author_token } = await req.json();

    if (!sentence_id || !author_token) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Check if vote exists
    const { data: existing } = await supabase
      .from("votes")
      .select("*")
      .eq("sentence_id", sentence_id)
      .eq("author_token", author_token)
      .single();

    if (existing) {
      // Remove vote
      await supabase
        .from("votes")
        .delete()
        .eq("sentence_id", sentence_id)
        .eq("author_token", author_token);
    } else {
      // Add vote
      await supabase.from("votes").insert({ sentence_id, author_token });
    }

    // Recalculate vote count
    const { count } = await supabase
      .from("votes")
      .select("*", { count: "exact", head: true })
      .eq("sentence_id", sentence_id);

    const newCount = count ?? 0;

    await supabase
      .from("sentences")
      .update({ votes: newCount })
      .eq("id", sentence_id);

    return NextResponse.json({ votes: newCount, voted: !existing });
  } catch (err) {
    console.error("POST /api/votes error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
