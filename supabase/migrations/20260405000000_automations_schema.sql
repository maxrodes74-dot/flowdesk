-- Automations table: scheduled tasks that run LLM prompts against the user's graph
create table automations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text not null default '',
  prompt text not null,
  schedule text not null default 'manual',  -- 'manual', 'on_create', 'on_update', 'daily_8am', 'daily_9pm', 'weekly_monday', 'weekly_sunday', 'monthly_1st'
  is_enabled boolean default true,
  is_preset boolean default false,  -- true for prebuilt automations
  preset_key text,  -- identifies which preset this was cloned from (e.g. 'auto_link', 'auto_tag')
  last_run_at timestamptz,
  last_run_status text check (last_run_status in ('success', 'error', 'running')),
  last_run_result text,  -- summary of what happened
  run_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Automation run history
create table automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid references automations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  status text not null check (status in ('running', 'success', 'error')),
  result text,  -- summary of what happened
  notes_created integer default 0,
  notes_updated integer default 0,
  links_created integer default 0,
  links_removed integer default 0,
  tokens_used integer default 0,
  duration_ms integer,
  error_message text,
  started_at timestamptz default now(),
  completed_at timestamptz
);

-- RLS
alter table automations enable row level security;
alter table automation_runs enable row level security;

create policy "Users can CRUD own automations" on automations for all using (auth.uid() = user_id);
create policy "Users can CRUD own automation_runs" on automation_runs for all using (auth.uid() = user_id);

-- Indexes
create index idx_automations_user_id on automations(user_id);
create index idx_automations_schedule on automations(schedule) where is_enabled = true;
create index idx_automation_runs_automation_id on automation_runs(automation_id);
create index idx_automation_runs_user_id on automation_runs(user_id);
create index idx_automation_runs_started_at on automation_runs(started_at desc);

-- Auto-update updated_at
create trigger automations_updated_at
  before update on automations
  for each row execute procedure public.update_updated_at();
