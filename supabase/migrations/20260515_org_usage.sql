-- Monthly usage counters per org for billing enforcement

create table if not exists org_usage (
  org_id    uuid not null references organizations(id) on delete cascade,
  month     text not null,  -- 'YYYY-MM'
  sends     int  not null default 0,
  ai_polish int  not null default 0,
  primary key (org_id, month)
);

alter table org_usage enable row level security;

-- Only admins/owners of the org can read their usage
create policy "org members can view usage"
  on org_usage for select
  using (
    exists (
      select 1 from org_members
      where org_members.org_id = org_usage.org_id
        and org_members.user_id = auth.uid()
    )
  );

-- Atomic upsert-and-increment for sends and ai_polish counters
create or replace function increment_org_usage(
  p_org_id  uuid,
  p_month   text,
  p_field   text,
  p_amount  int default 1
) returns void language plpgsql security definer as $$
begin
  if p_field = 'sends' then
    insert into org_usage(org_id, month, sends, ai_polish)
      values(p_org_id, p_month, p_amount, 0)
      on conflict(org_id, month)
      do update set sends = org_usage.sends + p_amount;
  elsif p_field = 'ai_polish' then
    insert into org_usage(org_id, month, sends, ai_polish)
      values(p_org_id, p_month, 0, p_amount)
      on conflict(org_id, month)
      do update set ai_polish = org_usage.ai_polish + p_amount;
  end if;
end;
$$;
