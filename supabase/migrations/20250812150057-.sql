-- Create trade_ideas table
create table if not exists trade_ideas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  description text,
  session text not null,
  strategy_tag text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index if not exists trade_ideas_user_id_idx on trade_ideas (user_id);
create index if not exists trade_ideas_created_at_idx on trade_ideas (created_at);
create index if not exists trade_ideas_session_idx on trade_ideas (session);

-- Enable RLS (Row Level Security)
alter table trade_ideas enable row level security;

-- Create policies for trade_ideas
create policy "Users can view their own trade ideas" on trade_ideas
  for select using (auth.uid() = user_id);

create policy "Users can insert their own trade ideas" on trade_ideas
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own trade ideas" on trade_ideas
  for update using (auth.uid() = user_id);

create policy "Users can delete their own trade ideas" on trade_ideas
  for delete using (auth.uid() = user_id);

-- Grant permissions to authenticated users
grant usage on schema public to authenticated;
grant all on table trade_ideas to authenticated;