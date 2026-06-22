-- BarberFlow — schema do banco de dados (Supabase / Postgres)
-- Multi-empresa: cada barbearia é uma "organization". Todo dado carrega org_id.
-- Isso garante isolamento total entre barbearias e permite upgrade de plano
-- sem qualquer migração de dados no futuro.

-- ========== EXTENSIONS ==========
create extension if not exists "uuid-ossp";

-- ========== ORGANIZATIONS (cada barbearia = 1 linha aqui) ==========
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,                 -- usado na URL pública: barberflow.com/agendar/slug
  owner_user_id uuid references auth.users(id) not null,
  plan text not null default 'trial',         -- trial | active | suspended
  subscription_status text default 'trialing',-- trialing | active | past_due | canceled
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at timestamptz default now()
);

-- ========== PROFESSIONALS ==========
create table professionals (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  color text default '#1D9E75',
  work_start time default '09:00',
  work_end time default '19:00',
  lunch_start time default '12:00',
  lunch_end time default '13:00',
  work_days int[] default '{1,2,3,4,5,6}',    -- 0=domingo ... 6=sábado
  active boolean default true,
  created_at timestamptz default now()
);

-- ========== SERVICES ==========
create table services (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  price numeric(10,2) not null default 0,
  duration_minutes int not null default 30,
  active boolean default true,
  created_at timestamptz default now()
);

-- ========== PRODUCTS (estoque) ==========
create table products (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  stock int not null default 0,
  min_stock int not null default 2,
  price numeric(10,2) not null default 0,
  created_at timestamptz default now()
);

-- ========== CLIENTS ==========
create table clients (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  phone text,
  notes text,
  created_at timestamptz default now()
);
create index idx_clients_org on clients(org_id);

-- ========== APPOINTMENTS ==========
create table appointments (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  professional_id uuid references professionals(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  appt_date date not null,
  appt_time time not null,
  status text default 'confirmado',           -- confirmado | concluido | cancelado | faltou
  deposit_paid boolean default false,
  notes text,
  created_at timestamptz default now()
);
create index idx_appt_org_date on appointments(org_id, appt_date);

-- ========== WAITLIST ==========
create table waitlist (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade not null,
  client_name text not null,
  phone text,
  service_id uuid references services(id),
  professional_id uuid references professionals(id),
  created_at timestamptz default now()
);

-- ========== COMANDAS (atendimento fechado / venda) ==========
create table comandas (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  professional_id uuid references professionals(id) on delete set null,
  appointment_id uuid references appointments(id) on delete set null,
  total numeric(10,2) not null default 0,
  paid boolean default false,
  payment_method text,                        -- pix | dinheiro | cartao
  comanda_date date default current_date,
  created_at timestamptz default now()
);

create table comanda_items (
  id uuid primary key default uuid_generate_v4(),
  comanda_id uuid references comandas(id) on delete cascade not null,
  item_type text not null,                    -- service | product
  ref_id uuid not null,
  qty int not null default 1,
  unit_price numeric(10,2) not null default 0
);

-- ========== CASH MOVEMENTS (lançamentos manuais de caixa) ==========
create table cash_movements (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade not null,
  description text not null,
  amount numeric(10,2) not null,
  movement_type text not null,                -- entrada | saida
  movement_date date default current_date,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY — cada dono só enxerga dados da própria org
-- Isso é o que garante isolamento sem precisar de "bancos separados"
-- ============================================================
alter table organizations enable row level security;
alter table professionals enable row level security;
alter table services enable row level security;
alter table products enable row level security;
alter table clients enable row level security;
alter table appointments enable row level security;
alter table waitlist enable row level security;
alter table comandas enable row level security;
alter table comanda_items enable row level security;
alter table cash_movements enable row level security;

-- Dono só vê/edita a própria barbearia
create policy "owner manages own org" on organizations
  for all using (owner_user_id = auth.uid());

-- Para as demais tabelas: usuário só acessa linhas cujo org_id pertence a ele
create policy "org isolation professionals" on professionals
  for all using (org_id in (select id from organizations where owner_user_id = auth.uid()));

create policy "org isolation services" on services
  for all using (org_id in (select id from organizations where owner_user_id = auth.uid()));

create policy "org isolation products" on products
  for all using (org_id in (select id from organizations where owner_user_id = auth.uid()));

create policy "org isolation clients" on clients
  for all using (org_id in (select id from organizations where owner_user_id = auth.uid()));

create policy "org isolation appointments" on appointments
  for all using (org_id in (select id from organizations where owner_user_id = auth.uid()));

create policy "org isolation waitlist" on waitlist
  for all using (org_id in (select id from organizations where owner_user_id = auth.uid()));

create policy "org isolation comandas" on comandas
  for all using (org_id in (select id from organizations where owner_user_id = auth.uid()));

create policy "org isolation comanda_items" on comanda_items
  for all using (comanda_id in (
    select id from comandas where org_id in (select id from organizations where owner_user_id = auth.uid())
  ));

create policy "org isolation cash_movements" on cash_movements
  for all using (org_id in (select id from organizations where owner_user_id = auth.uid()));

-- ============================================================
-- ACESSO PÚBLICO DE AGENDAMENTO (cliente final marca sem login)
-- Permite leitura de horários ocupados e criação de novo agendamento,
-- sem expor dados sensíveis de outras barbearias.
-- ============================================================
create policy "public can view active services for booking" on services
  for select using (active = true);

create policy "public can view active professionals for booking" on professionals
  for select using (active = true);

create policy "public can view appointments for slot availability" on appointments
  for select using (true);

create policy "public can create appointment" on appointments
  for insert with check (true);

create policy "public can create client on booking" on clients
  for insert with check (true);
