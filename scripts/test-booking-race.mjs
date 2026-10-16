import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and server-only SUPABASE_SECRET_KEY in .env.local.");
  process.exit(2);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const nonce = crypto.randomUUID();
const emailA = `race-a-${nonce}@example.invalid`;
const emailB = `race-b-${nonce}@example.invalid`;

try {
  const [{ data: business, error: businessError }, { data: service, error: serviceError }, { data: staff, error: staffError }] = await Promise.all([
    supabase.from("businesses").select("id").eq("slug", "form-and-fade").single(),
    supabase.from("services").select("id,duration_minutes").eq("name", "Der klassische Schnitt").single(),
    supabase.from("staff").select("id").eq("display_name", "Mara").single(),
  ]);

  if (businessError || serviceError || staffError) {
    throw new Error("Could not find the fictional test business, service, or staff member.");
  }

  const startsAtMs = Math.ceil((Date.now() + 400 * 24 * 60 * 60 * 1000) / 60_000) * 60_000;
  const startsAt = new Date(startsAtMs).toISOString();
  const endsAt = new Date(startsAtMs + service.duration_minutes * 60_000).toISOString();
  const base = {
    business_id: business.id,
    service_id: service.id,
    staff_id: staff.id,
    customer_name: "Synthetic concurrency test",
    starts_at: startsAt,
    ends_at: endsAt,
    status: "confirmed",
  };

  const results = await Promise.all([
    supabase.from("appointments").insert({ ...base, customer_email: emailA }).select("id").single(),
    supabase.from("appointments").insert({ ...base, customer_email: emailB }).select("id").single(),
  ]);

  const winners = results.filter(({ error }) => !error);
  const conflicts = results.filter(({ error }) => error?.code === "23P01");
  if (winners.length !== 1 || conflicts.length !== 1) {
    throw new Error(`Expected one accepted booking and one overlap conflict; got ${winners.length} accepted and ${conflicts.length} conflicts.`);
  }

  console.log("PASS: concurrent overlapping requests produced exactly one booking and one database conflict.");
} finally {
  const { error } = await supabase
    .from("appointments")
    .delete()
    .in("customer_email", [emailA, emailB]);
  if (error) {
    throw new Error("Concurrency test cleanup failed; inspect only the synthetic race-* test rows.");
  }
}
