-- Ejecutar completo en Supabase SQL Editor del proyecto geguxvqjaoqceasgzefd

create table if not exists instalaciones (
  id text primary key,
  configuracion jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists registros (
  id text primary key,
  instalacion_id text not null references instalaciones(id) on delete cascade,
  fecha date not null,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists visitas (
  id text primary key,
  instalacion_id text not null references instalaciones(id) on delete cascade,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create index if not exists idx_registros_instalacion on registros(instalacion_id);
create index if not exists idx_registros_fecha on registros(fecha desc);
create index if not exists idx_visitas_instalacion on visitas(instalacion_id);

alter table instalaciones enable row level security;
alter table registros enable row level security;
alter table visitas enable row level security;

do $$ begin
  create policy "Acceso publico instalaciones" on instalaciones for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Acceso publico registros" on registros for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Acceso publico visitas" on visitas for all using (true) with check (true);
exception when duplicate_object then null; end $$;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  instalacion_id text,
  created_at timestamptz not null default now()
);

create table if not exists suscripciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  instalacion_id text,
  plan text not null check (plan in ('mensual', 'anual', 'trial')),
  estado text not null check (estado in ('trial', 'activa', 'vencida', 'cancelada')),
  proveedor text check (proveedor is null or proveedor in ('stripe', 'wompi', 'trial')),
  proveedor_customer_id text,
  proveedor_subscription_id text,
  proveedor_transaction_id text,
  monto_cop integer,
  fecha_inicio timestamptz not null default now(),
  fecha_vencimiento timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_suscripciones_user on suscripciones(user_id);
create index if not exists idx_suscripciones_estado on suscripciones(estado);

alter table instalaciones add column if not exists user_id uuid references auth.users(id);

alter table profiles enable row level security;
alter table suscripciones enable row level security;

do $$ begin
  create policy "profiles own" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "suscripciones own read" on suscripciones for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;

  insert into public.suscripciones (user_id, plan, estado, proveedor, fecha_vencimiento)
  values (new.id, 'trial', 'trial', 'trial', now() + interval '14 days');

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trial de 14 dias para usuarios existentes
insert into public.profiles (id, email, full_name)
select id, email, coalesce(raw_user_meta_data->>'full_name', '')
from auth.users
on conflict (id) do nothing;

update public.suscripciones
set estado = 'vencida', updated_at = now()
where estado in ('trial', 'activa');

insert into public.suscripciones (user_id, plan, estado, proveedor, fecha_inicio, fecha_vencimiento)
select u.id, 'trial', 'trial', 'trial', now(), now() + interval '14 days'
from auth.users u;
