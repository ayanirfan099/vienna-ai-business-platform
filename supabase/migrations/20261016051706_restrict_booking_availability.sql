-- Availability includes appointment-derived free/busy data. Keep every
-- SECURITY DEFINER booking function behind the trusted server-side role.
revoke all on function public.list_available_booking_slots(text, uuid, uuid, date)
  from public, anon, authenticated;
grant execute on function public.list_available_booking_slots(text, uuid, uuid, date)
  to service_role;
