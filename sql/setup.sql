-- Run in Supabase SQL editor. Never expose service_role key in browser.
create table if not exists public.mitta_codes (
  code_hash text primary key,
  label text not null default '',
  activated_at timestamptz,
  retired_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists mitta_one_active_code
  on public.mitta_codes ((true)) where activated_at is not null and retired_at is null;
create table if not exists public.mitta_gate_state (
  singleton boolean primary key default true check (singleton),
  active_hash text references public.mitta_codes(code_hash),
  changed_at timestamptz not null default now(),
  version bigint not null default 0
);
insert into public.mitta_gate_state(singleton) values(true) on conflict do nothing;
create or replace function public.mitta_activate_code(p_hash text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists(select 1 from mitta_codes where code_hash=p_hash) then
    raise exception 'Unknown code';
  end if;
  update mitta_codes set retired_at=now() where activated_at is not null and retired_at is null;
  update mitta_codes set activated_at=now(), retired_at=null where code_hash=p_hash;
  update mitta_gate_state set active_hash=p_hash, changed_at=now(), version=version+1 where singleton=true;
end; $$;
revoke all on function public.mitta_activate_code(text) from public, anon, authenticated;
revoke all on public.mitta_codes, public.mitta_gate_state from anon, authenticated;

grant execute on function public.mitta_activate_code(text) to service_role;
