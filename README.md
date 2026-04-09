# One-Sentence MMO

> A living, branching story written one sentence at a time — by everyone.

**One-Sentence MMO** is a collaborative fiction web app where strangers co-author an infinite narrative tree. Pick any sentence, continue it with your own, and watch the story fork into countless parallel worlds. No accounts. No sign-ups. Just write.

---

## How it works

- **One sentence per hour** — your creative throttle keeps the world from flooding
- **Branch anywhere** — reply to any existing sentence, not just the latest one
- **Vote to shape the canon** — the most-loved path becomes the official story
- **Daily chronicle** — an AI town crier narrates what happened in the world each day
- **No accounts** — your identity is a deterministic fantasy name and a pixel avatar, generated from a token stored in your browser

---

## What it looks like

The world renders as an infinite **sticky-note canvas** — a FigJam-style board of colorful cards connected by tapered wooden branches. Pan by dragging the background. Zoom with the scroll wheel. Drag individual nodes to rearrange your view.

Hover a card to reveal **Like** and **Continue →** buttons. Click Continue to open the branch panel, where you'll see the full ancestry of the sentence and a textarea to write your reply.

---

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Database | Supabase (Postgres + Realtime) |
| Canvas | Framer Motion (pan, zoom, spring animations) |
| AI narrator | Groq — `llama-3.3-70b-versatile` (free tier) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Identity | Deterministic from UUID token — no auth |

---

## Running locally

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/oneliner.git
cd oneliner
npm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a free project. Then run the schema in the SQL editor:

```bash
# contents in supabase/schema.sql
```

Enable **Realtime** on the `sentences` table in the Supabase dashboard (Table Editor → Realtime toggle).

### 3. Get a Groq API key

Sign up at [console.groq.com](https://console.groq.com) — free tier is more than enough.

### 4. Configure environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
GROQ_API_KEY=gsk_...
```

### 5. Seed the world

Insert a root sentence directly in Supabase SQL editor:

```sql
insert into sentences (body, author_token, author_name, parent_id)
values (
  'The last lighthouse keeper wound the clock for the final time, not knowing the sea had already decided to forget the shore.',
  'system',
  'The Narrator',
  null
);
```

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
app/
  page.tsx              # Main canvas world
  narrator/page.tsx     # Daily AI chronicle page
  api/
    sentences/route.ts  # POST — add a sentence (rate-limited)
    votes/route.ts      # POST — toggle upvote
    narrator/route.ts   # GET — fetch or generate daily summary

components/
  canvas/
    WorldCanvas.tsx     # Pan/zoom canvas with node positions
    SentenceNode.tsx    # Sticky-note card with drag + actions
    ConnectorLines.tsx  # Tapered SVG branch connectors
  panel/
    BranchPanel.tsx     # Right drawer — ancestry + compose
    CooldownTimer.tsx   # Circular countdown ring
    AncestryBreadcrumb.tsx
  identity/
    Identicon.tsx       # 5x5 deterministic pixel avatar

lib/
  tree.ts               # Tree layout, canonical path, ancestry
  identity.ts           # Token generation, fantasy names, identicons
  supabase/             # Browser + server Supabase clients

hooks/
  useIdentity.ts        # Load/create anonymous token
  useTree.ts            # Fetch sentences, build tree
  useRealtime.ts        # Supabase Realtime subscription
  useCooldown.ts        # Rate-limit countdown
```

---

## Database schema

```sql
sentences (
  id uuid,
  parent_id uuid → sentences(id),
  body text (20–280 chars),
  author_token text,
  author_name text,
  votes int,
  created_at timestamptz
)

votes (
  sentence_id uuid,
  author_token text,
  PRIMARY KEY (sentence_id, author_token)   -- one vote per person
)

narrator_log (
  date date UNIQUE,
  summary text,
  canonical_path jsonb
)
```

---

## How the canonical path works

At any point in time, there is one "official" story — the path from root to leaf that accumulated the most votes. Ties are broken by `created_at` (older sentence wins). This path is what the AI narrator summarizes each day.

---

## Rate limiting

Each anonymous token may contribute one sentence per rolling 60-minute window. The cooldown timer shows exactly how long until your quill returns.

---

## License

MIT
