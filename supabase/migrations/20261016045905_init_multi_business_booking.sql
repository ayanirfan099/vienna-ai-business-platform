-- Multi-tenant business starter and database-enforced booking conflicts.
-- Customer fields are intentionally minimal and this seed uses fictional data only.

create extension if not exists btree_gist with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  display_name text not null check (char_length(display_name) between 1 and 120),
  time_zone text not null default 'Europe/Vienna',
  phone text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);
create index business_members_user_id_idx on public.business_members(user_id);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text,
  duration_minutes integer not null check (duration_minutes between 10 and 360),
  price_cents integer not null check (price_cents >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, id),
  unique (business_id, name)
);
create index services_business_active_idx on public.services(business_id, is_active);

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 120),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, id),
  unique (business_id, display_name)
);
create index staff_business_active_idx on public.staff(business_id, is_active);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  service_id uuid not null,
  staff_id uuid not null,
  customer_name text not null check (char_length(btrim(customer_name)) between 1 and 120),
  customer_email text check (customer_email is null or char_length(customer_email) <= 254),
  customer_phone text check (customer_phone is null or char_length(customer_phone) <= 40),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  created_at timestamptz not null default now(),
  constraint appointments_positive_duration check (ends_at > starts_at),
  constraint appointments_customer_contact check (
    customer_email is not null or customer_phone is not null
  ),
  constraint appointments_service_same_business
    foreign key (business_id, service_id)
    references public.services(business_id, id) on delete restrict,
  constraint appointments_staff_same_business
    foreign key (business_id, staff_id)
    references public.staff(business_id, id) on delete restrict,
  constraint appointments_staff_time_no_overlap
    exclude using gist (
      business_id with =,
      staff_id with =,
      tstzrange(starts_at, ends_at, '[)') with &&
    ) where (status in ('pending', 'confirmed'))
);
create index appointments_business_start_idx on public.appointments(business_id, starts_at);
create index appointments_staff_start_idx on public.appointments(staff_id, starts_at);
comment on column public.appointments.customer_email is
  'Personal data: retain only as long as needed for the appointment and legal obligations.';
comment on column public.appointments.customer_phone is
  'Personal data: retain only as long as needed for the appointment and legal obligations.';

-- This SECURITY DEFINER helper is kept in a non-exposed schema, checks the live
-- authenticated user, and is executable only by authenticated sessions.
create or replace function private.has_business_role(p_business_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.business_members as bm
    where bm.business_id = p_business_id
      and bm.user_id = (select auth.uid())
      and bm.role = any (p_roles)
  );
$$;
revoke all on function private.has_business_role(uuid, text[]) from public, anon, authenticated;
grant execute on function private.has_business_role(uuid, text[]) to authenticated;

alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.services enable row level security;
alter table public.staff enable row level security;
alter table public.appointments enable row level security;

create policy businesses_public_active_read
  on public.businesses for select to anon, authenticated
  using (is_active);
create policy businesses_member_read
  on public.businesses for select to authenticated
  using (private.has_business_role(id, array['owner', 'manager', 'staff']));
create policy businesses_owner_update
  on public.businesses for update to authenticated
  using (private.has_business_role(id, array['owner']))
  with check (private.has_business_role(id, array['owner']));

create policy business_members_self_or_admin_read
  on public.business_members for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.has_business_role(business_id, array['owner', 'manager'])
  );

create policy services_public_active_read
  on public.services for select to anon, authenticated
  using (
    is_active and exists (
      select 1 from public.businesses as b
      where b.id = business_id and b.is_active
    )
  );
create policy services_manager_read
  on public.services for select to authenticated
  using (private.has_business_role(business_id, array['owner', 'manager']));
create policy services_manager_insert
  on public.services for insert to authenticated
  with check (private.has_business_role(business_id, array['owner', 'manager']));
create policy services_manager_update
  on public.services for update to authenticated
  using (private.has_business_role(business_id, array['owner', 'manager']))
  with check (private.has_business_role(business_id, array['owner', 'manager']));
create policy services_manager_delete
  on public.services for delete to authenticated
  using (private.has_business_role(business_id, array['owner', 'manager']));

create policy staff_public_active_read
  on public.staff for select to anon, authenticated
  using (
    is_active and exists (
      select 1 from public.businesses as b
      where b.id = business_id and b.is_active
    )
  );
create policy staff_manager_read
  on public.staff for select to authenticated
  using (private.has_business_role(business_id, array['owner', 'manager']));
create policy staff_manager_insert
  on public.staff for insert to authenticated
  with check (private.has_business_role(business_id, array['owner', 'manager']));
create policy staff_manager_update
  on public.staff for update to authenticated
  using (private.has_business_role(business_id, array['owner', 'manager']))
  with check (private.has_business_role(business_id, array['owner', 'manager']));
create policy staff_manager_delete
  on public.staff for delete to authenticated
  using (private.has_business_role(business_id, array['owner', 'manager']));

create policy appointments_owner_manager_read
  on public.appointments for select to authenticated
  using (private.has_business_role(business_id, array['owner', 'manager']));
create policy appointments_owner_manager_insert
  on public.appointments for insert to authenticated
  with check (private.has_business_role(business_id, array['owner', 'manager']));
create policy appointments_owner_manager_update
  on public.appointments for update to authenticated
  using (private.has_business_role(business_id, array['owner', 'manager']))
  with check (private.has_business_role(business_id, array['owner', 'manager']));

grant select on public.businesses, public.services, public.staff to anon, authenticated;
grant update on public.businesses to authenticated;
grant select on public.business_members to authenticated;
grant select, insert, update, delete on public.services, public.staff to authenticated;
grant select, insert, update on public.appointments to authenticated;
grant all on public.businesses, public.business_members, public.services,
  public.staff, public.appointments to service_role;

-- Fictional demo tenant and public catalog; no people or customer data are seeded.
insert into public.businesses (slug, display_name, time_zone, phone, address)
values (
  'form-and-fade', 'FORM & FADE', 'Europe/Vienna', '+43 1 523 18 09',
  'Neubaugasse 28, 1070 Wien'
)
on conflict (slug) do update set
  display_name = excluded.display_name,
  time_zone = excluded.time_zone,
  phone = excluded.phone,
  address = excluded.address;

insert into public.services (business_id, name, description, duration_minutes, price_cents)
select b.id, s.name, s.description, s.duration_minutes, s.price_cents
from public.businesses as b
cross join (values
  ('Der klassische Schnitt', 'Beratung, Schnitt & Styling', 45, 4200),
  ('Skin Fade', 'Präziser Fade, sauber ausgearbeitet', 45, 4500),
  ('Schnitt & Bart', 'Komplett gepflegt, von Kopf bis Kinn', 60, 6200)
) as s(name, description, duration_minutes, price_cents)
where b.slug = 'form-and-fade'
on conflict (business_id, name) do update set
  description = excluded.description,
  duration_minutes = excluded.duration_minutes,
  price_cents = excluded.price_cents,
  is_active = true;

insert into public.staff (business_id, display_name)
select b.id, 'Mara'
from public.businesses as b
where b.slug = 'form-and-fade'
on conflict (business_id, display_name) do update set is_active = true;
