-- Enable pgvector
create extension if not exists vector;

-- Notes (the atomic unit)
create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default '',
  content text not null default '',
  metadata jsonb default '{}',
  embedding vector(1536),
  is_archived boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Full-text search column
alter table notes add column fts tsvector
  generated always as (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))) stored;

-- Links between notes
create table links (
  id uuid primary key default gen_random_uuid(),
  source_note_id uuid references notes(id) on delete cascade not null,
  target_note_id uuid references notes(id) on delete cascade not null,
  context text,
  auto_generated boolean default false,
  strength float default 1.0,
  dismissed boolean default false,
  created_at timestamptz default now(),
  unique(source_note_id, target_note_id)
);

-- Tags
create table tags (
  id uuid primary key default gen_random_uuid(),
  note_id uuid references notes(id) on delete cascade not null,
  tag text not null,
  auto_generated boolean default false,
  created_at timestamptz default now(),
  unique(note_id, tag)
);

-- API keys for MCP/REST access
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'Default',
  key_hash text not null,
  key_prefix text not null,
  last_used_at timestamptz,
  created_at timestamptz default now()
);

-- User profiles/settings
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  tier text default 'free' check (tier in ('free', 'pro')),
  settings jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table notes enable row level security;
alter table links enable row level security;
alter table tags enable row level security;
alter table api_keys enable row level security;
alter table profiles enable row level security;

create policy "Users can CRUD own notes" on notes for all using (auth.uid() = user_id);
create policy "Users can CRUD own links" on links for all using (
  exists (select 1 from notes where id = source_note_id and user_id = auth.uid())
);
create policy "Users can CRUD own tags" on tags for all using (
  exists (select 1 from notes where id = note_id and user_id = auth.uid())
);
create policy "Users can CRUD own api_keys" on api_keys for all using (auth.uid() = user_id);
create policy "Users can CRUD own profile" on profiles for all using (auth.uid() = id);

-- Indexes
create index idx_notes_user_id on notes(user_id);
create index idx_notes_updated_at on notes(updated_at desc);
create index idx_notes_embedding on notes using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index idx_links_source on links(source_note_id);
create index idx_links_target on links(target_note_id);
create index idx_tags_note_id on tags(note_id);
create index idx_tags_tag on tags(tag);
create index idx_notes_fts on notes using gin(fts);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger notes_updated_at
  before update on notes
  for each row execute procedure public.update_updated_at();

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure public.update_updated_at();
