-- Tenant-specific local opening hours and bounded public availability reads.
-- Booking writes are callable only by the trusted server-side service role.

create table public.business_opening_hours (
  business_id uuid not null references public.businesses(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  primary key (business_id, weekday),
  check (closes_at > opens_at)
);

alter table public.business_opening_hours enable row level security;
grant select on public.business_opening_hours to anon, authenticated;
grant all on public.business_opening_hours to service_role;
create policy opening_hours_public_read on public.business_opening_hours
  for select to anon, authenticated using (
    exists (select 1 from public.businesses b where b.id = business_id and b.is_active)
  );

insert into public.business_opening_hours (business_id, weekday, opens_at, closes_at)
select b.id, h.weekday, h.opens_at, h.closes_at
from public.businesses b
cross join (values
  (2, time '10:00', time '19:00'),
  (3, time '10:00', time '19:00'),
  (4, time '10:00', time '19:00'),
  (5, time '10:00', time '19:00'),
  (6, time '09:00', time '16:00')
) h(weekday, opens_at, closes_at)
where b.slug = 'form-and-fade'
on conflict (business_id, weekday) do update set
  opens_at = excluded.opens_at, closes_at = excluded.closes_at;

create or replace function public.list_available_booking_slots(
  p_business_slug text,
  p_service_id uuid,
  p_staff_id uuid,
  p_local_date date
)
returns table(slot timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_business_id uuid;
  v_time_zone text;
  v_duration interval;
  v_open time;
  v_close time;
  v_open_at timestamptz;
  v_close_at timestamptz;
begin
  select b.id, b.time_zone into v_business_id, v_time_zone
  from public.businesses b
  where b.slug = p_business_slug and b.is_active;
  if v_business_id is null then return; end if;

  if p_local_date < (now() at time zone v_time_zone)::date
    or p_local_date > (now() at time zone v_time_zone)::date + 60 then
    return;
  end if;

  select make_interval(mins => s.duration_minutes) into v_duration
  from public.services s
  where s.id = p_service_id and s.business_id = v_business_id and s.is_active;
  if v_duration is null or not exists (
    select 1 from public.staff st
    where st.id = p_staff_id and st.business_id = v_business_id and st.is_active
  ) then return; end if;

  select h.opens_at, h.closes_at into v_open, v_close
  from public.business_opening_hours h
  where h.business_id = v_business_id
    and h.weekday = extract(dow from p_local_date)::smallint;
  if not found then return; end if;

  v_open_at := (p_local_date + v_open) at time zone v_time_zone;
  v_close_at := (p_local_date + v_close) at time zone v_time_zone;

  return query
  select candidate.start_at
  from generate_series(v_open_at, v_close_at - v_duration, interval '30 minutes') as candidate(start_at)
  where candidate.start_at > now()
    and not exists (
      select 1 from public.appointments a
      where a.business_id = v_business_id
        and a.staff_id = p_staff_id
        and a.status in ('pending', 'confirmed')
        and tstzrange(a.starts_at, a.ends_at, '[)')
          && tstzrange(candidate.start_at, candidate.start_at + v_duration, '[)')
    )
  order by candidate.start_at;
end;
$$;

create or replace function public.create_public_booking(
  p_business_slug text,
  p_service_id uuid,
  p_staff_id uuid,
  p_local_start timestamp without time zone,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_id uuid;
  v_time_zone text;
  v_duration interval;
  v_open time;
  v_close time;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_local_date date := p_local_start::date;
  v_appointment_id uuid;
begin
  if p_customer_name is null or char_length(btrim(p_customer_name)) not between 1 and 120
    or (nullif(btrim(p_customer_email), '') is null and nullif(btrim(p_customer_phone), '') is null)
    or char_length(coalesce(p_customer_email, '')) > 254
    or char_length(coalesce(p_customer_phone, '')) > 40 then
    raise exception using errcode = '22023', message = 'Invalid booking details';
  end if;

  select b.id, b.time_zone into v_business_id, v_time_zone
  from public.businesses b
  where b.slug = p_business_slug and b.is_active;
  if v_business_id is null then
    raise exception using errcode = 'P0002', message = 'Business unavailable';
  end if;

  select make_interval(mins => s.duration_minutes) into v_duration
  from public.services s
  where s.id = p_service_id and s.business_id = v_business_id and s.is_active;
  if v_duration is null or not exists (
    select 1 from public.staff st
    where st.id = p_staff_id and st.business_id = v_business_id and st.is_active
  ) then
    raise exception using errcode = '22023', message = 'Invalid booking option';
  end if;

  if v_local_date < (now() at time zone v_time_zone)::date
    or v_local_date > (now() at time zone v_time_zone)::date + 60
    or extract(second from p_local_start) <> 0
    or extract(minute from p_local_start)::integer % 30 <> 0 then
    raise exception using errcode = '22023', message = 'Invalid booking time';
  end if;

  select h.opens_at, h.closes_at into v_open, v_close
  from public.business_opening_hours h
  where h.business_id = v_business_id
    and h.weekday = extract(dow from v_local_date)::smallint;
  if not found then
    raise exception using errcode = '22023', message = 'Business is closed';
  end if;

  v_starts_at := p_local_start at time zone v_time_zone;
  v_ends_at := v_starts_at + v_duration;
  if v_starts_at <= now()
    or p_local_start < v_local_date + v_open
    or (v_ends_at at time zone v_time_zone) > v_local_date + v_close then
    raise exception using errcode = '22023', message = 'Outside opening hours';
  end if;

  insert into public.appointments (
    business_id, service_id, staff_id, customer_name,
    customer_email, customer_phone, starts_at, ends_at, status
  ) values (
    v_business_id, p_service_id, p_staff_id, btrim(p_customer_name),
    nullif(btrim(p_customer_email), ''), nullif(btrim(p_customer_phone), ''),
    v_starts_at, v_ends_at, 'confirmed'
  ) returning id into v_appointment_id;
  return v_appointment_id;
end;
$$;

revoke all on function public.list_available_booking_slots(text, uuid, uuid, date) from public;
grant execute on function public.list_available_booking_slots(text, uuid, uuid, date) to anon, authenticated, service_role;
revoke all on function public.create_public_booking(text, uuid, uuid, timestamp without time zone, text, text, text) from public, anon, authenticated;
grant execute on function public.create_public_booking(text, uuid, uuid, timestamp without time zone, text, text, text) to service_role;
