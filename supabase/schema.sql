-- One-Sentence MMO Database Schema
-- Run this in your Supabase SQL editor

create table if not exists sentences (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references sentences(id) on delete cascade,
  body text not null check (char_length(body) between 20 and 280),
  author_token text not null,
  author_name text not null,
  votes int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists votes (
  sentence_id uuid references sentences(id) on delete cascade,
  author_token text not null,
  primary key (sentence_id, author_token)
);

create table if not exists narrator_log (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  summary text not null,
  canonical_path jsonb not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists sentences_parent_id_idx on sentences(parent_id);
create index if not exists sentences_author_token_idx on sentences(author_token);
create index if not exists sentences_created_at_idx on sentences(created_at);
create index if not exists narrator_log_date_idx on narrator_log(date);

-- Enable Row Level Security
alter table sentences enable row level security;
alter table votes enable row level security;
alter table narrator_log enable row level security;

-- Policies: allow anon read
create policy "Anyone can read sentences" on sentences for select using (true);
create policy "Anyone can read votes" on votes for select using (true);
create policy "Anyone can read narrator_log" on narrator_log for select using (true);

-- Service role can do everything (used by API routes with service_role key)
-- The API routes use the service role key so they bypass RLS

-- Enable Realtime on sentences table
-- Run in Supabase Dashboard: Database > Replication > enable sentences table
-- Or via SQL:
-- alter publication supabase_realtime add table sentences;
