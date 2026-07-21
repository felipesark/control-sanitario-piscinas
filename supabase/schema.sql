-- Ejecutar en Supabase SQL Editor
-- https://supabase.com/dashboard

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

create policy "Acceso publico instalaciones" on instalaciones for all using (true) with check (true);
create policy "Acceso publico registros" on registros for all using (true) with check (true);
create policy "Acceso publico visitas" on visitas for all using (true) with check (true);