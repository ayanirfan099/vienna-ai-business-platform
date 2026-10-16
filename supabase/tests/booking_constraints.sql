-- Repeatable SQL smoke test. Every appointment uses synthetic data and is removed
-- before the test transaction ends. Live parallel requests are covered by
-- `npm run test:db-race` against an explicitly configured development project.
do $$
declare
  v_business_id uuid;
  v_service_id uuid;
  v_staff_id uuid;
  v_overlap_rejected boolean := false;
begin
  select b.id, s.id, st.id
    into v_business_id, v_service_id, v_staff_id
  from public.businesses b
  join public.services s on s.business_id = b.id and s.name = 'Der klassische Schnitt'
  join public.staff st on st.business_id = b.id and st.display_name = 'Mara'
  where b.slug = 'form-and-fade';

  if v_business_id is null or v_service_id is null or v_staff_id is null then
    raise exception 'Fictional booking test fixture is missing';
  end if;

  insert into public.appointments (
    business_id, service_id, staff_id, customer_name, customer_email, starts_at, ends_at
  ) values (
    v_business_id, v_service_id, v_staff_id, 'Synthetic SQL test', 'constraint-a@example.invalid',
    '2099-01-02 10:00:00+00', '2099-01-02 10:45:00+00'
  );

  begin
    insert into public.appointments (
      business_id, service_id, staff_id, customer_name, customer_email, starts_at, ends_at
    ) values (
      v_business_id, v_service_id, v_staff_id, 'Synthetic SQL test', 'constraint-b@example.invalid',
      '2099-01-02 10:30:00+00', '2099-01-02 11:15:00+00'
    );
  exception when exclusion_violation then
    v_overlap_rejected := true;
  end;

  if not v_overlap_rejected then
    raise exception 'Overlapping appointment was not rejected';
  end if;

  -- Adjacent appointments are valid because the occupied interval is [start,end).
  insert into public.appointments (
    business_id, service_id, staff_id, customer_name, customer_email, starts_at, ends_at
  ) values (
    v_business_id, v_service_id, v_staff_id, 'Synthetic SQL test', 'constraint-c@example.invalid',
    '2099-01-02 10:45:00+00', '2099-01-02 11:30:00+00'
  );

  delete from public.appointments
  where customer_email in (
    'constraint-a@example.invalid', 'constraint-b@example.invalid', 'constraint-c@example.invalid'
  );
end;
$$;
