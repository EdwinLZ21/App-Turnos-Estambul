create extension if not exists "pgcrypto";

create table if not exists public.driver_shifts (
	id uuid primary key default gen_random_uuid(),
	driver_id text,
	driver_email text not null,
	date date not null,
	entry_time time not null,
	exit_time time not null,
	hours_worked numeric(5,2) not null,
	tickets_delivered integer not null default 0,
	net_total numeric(10,2) not null default 0,
	incidents text,
	status text not null default 'pending' check (status in ('pending','reviewed','active')),
	reviewed_by text,
	reviewed_at timestamptz,
	review_notes text,
	home_delivery_orders int[] not null default '{}',
	online_orders text[] not null default '{}',
	molares_orders boolean not null default false,
	molares_order_numbers text[] not null default '{}',
	total_tickets integer not null default 0,
	total_amount numeric(10,2) not null default 0,
	total_earned numeric(10,2) not null default 0,
	total_sales_pedidos numeric(10,2) not null default 0,
	total_datafono numeric(10,2) not null default 0,
	total_caja_neto numeric(10,2) not null default 0,
	cash_change numeric(10,2) not null default 0,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists idx_driver_shifts_driver_email on public.driver_shifts (driver_email);
create index if not exists idx_driver_shifts_date on public.driver_shifts (date);
create index if not exists idx_driver_shifts_status on public.driver_shifts (status);

create or replace function public.set_updated_at() returns trigger as $$
begin
	new.updated_at = now();
	return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at on public.driver_shifts;
create trigger trg_set_updated_at
before update on public.driver_shifts
for each row execute function public.set_updated_at();


