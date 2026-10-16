-- Keep a single SELECT policy per table/role while preserving public catalog reads.
drop policy businesses_public_active_read on public.businesses;
drop policy businesses_member_read on public.businesses;
create policy businesses_anon_active_read
  on public.businesses for select to anon
  using (is_active);
create policy businesses_authenticated_read
  on public.businesses for select to authenticated
  using (
    is_active or private.has_business_role(id, array['owner', 'manager', 'staff'])
  );

drop policy services_public_active_read on public.services;
drop policy services_manager_read on public.services;
create policy services_anon_active_read
  on public.services for select to anon
  using (
    is_active and exists (
      select 1 from public.businesses as b
      where b.id = business_id and b.is_active
    )
  );
create policy services_authenticated_read
  on public.services for select to authenticated
  using (
    (is_active and exists (
      select 1 from public.businesses as b
      where b.id = business_id and b.is_active
    )) or private.has_business_role(business_id, array['owner', 'manager'])
  );

drop policy staff_public_active_read on public.staff;
drop policy staff_manager_read on public.staff;
create policy staff_anon_active_read
  on public.staff for select to anon
  using (
    is_active and exists (
      select 1 from public.businesses as b
      where b.id = business_id and b.is_active
    )
  );
create policy staff_authenticated_read
  on public.staff for select to authenticated
  using (
    (is_active and exists (
      select 1 from public.businesses as b
      where b.id = business_id and b.is_active
    )) or private.has_business_role(business_id, array['owner', 'manager'])
  );

-- The composite FK is used when checking service deletion or reassignment.
create index appointments_business_service_idx
  on public.appointments (business_id, service_id);
