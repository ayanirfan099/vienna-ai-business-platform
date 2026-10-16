-- Smoke tests for local-time availability and server-validated booking writes.
-- All inserts are rolled back and use synthetic .invalid contact data.
begin;
do $$
declare
  v_service uuid;
  v_staff uuid;
  v_booking uuid;
  v_duration interval;
  v_has_slot boolean;
begin
  select s.id into v_service
  from public.services s join public.businesses b on b.id = s.business_id
  where b.slug = 'form-and-fade' and s.name = 'Der klassische Schnitt';
  select st.id into v_staff
  from public.staff st join public.businesses b on b.id = st.business_id
  where b.slug = 'form-and-fade' and st.display_name = 'Mara';

  select exists (
    select 1 from public.list_available_booking_slots(
      'form-and-fade', v_service, v_staff, date '2026-11-03'
    ) a where a.slot = timestamp '2026-11-03 10:00' at time zone 'Europe/Vienna'
  ) into v_has_slot;
  if not v_has_slot then raise exception 'Expected open 10:00 Vienna slot'; end if;

  v_booking := public.create_public_booking(
    'form-and-fade', v_service, v_staff, timestamp '2026-11-03 10:00',
    'Synthetic SQL test', 'synthetic-test@example.invalid', null
  );
  select a.ends_at - a.starts_at into v_duration
  from public.appointments a where a.id = v_booking;
  if v_duration <> interval '45 minutes' then
    raise exception 'Appointment end was not derived from service duration';
  end if;

  select exists (
    select 1 from public.list_available_booking_slots(
      'form-and-fade', v_service, v_staff, date '2026-11-03'
    ) a where a.slot = timestamp '2026-11-03 10:00' at time zone 'Europe/Vienna'
  ) into v_has_slot;
  if v_has_slot then raise exception 'Booked slot is still available'; end if;

  begin
    perform public.create_public_booking(
      'form-and-fade', v_service, v_staff, timestamp '2026-11-03 10:30',
      'Synthetic SQL test', null, '+4311111111'
    );
    raise exception 'Overlapping booking should be rejected';
  exception when exclusion_violation then null;
  end;

  begin
    perform public.create_public_booking(
      'form-and-fade', v_service, v_staff, timestamp '2026-11-03 18:30',
      'Synthetic SQL test', null, '+4311111111'
    );
    raise exception 'Booking outside opening hours should be rejected';
  exception when invalid_parameter_value then null;
  end;
end $$;
rollback;
