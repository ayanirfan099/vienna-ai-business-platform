import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export const runtime = "nodejs";

const bookingSchema = z.object({
  businessSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid(),
  localStart: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00$/),
  customerName: z.string().trim().min(1).max(120),
  customerEmail: z.union([z.string().trim().email().max(254), z.literal("")]).optional(),
  customerPhone: z.union([z.string().trim().min(5).max(40), z.literal("")]).optional(),
  website: z.string().max(0).optional(),
}).refine((input) => Boolean(input.customerEmail || input.customerPhone), {
  message: "Provide one contact method",
});

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  const supabase = adminClient();
  if (!supabase) return jsonError("Online booking is not configured yet.", 503);

  const params = request.nextUrl.searchParams;
  const businessSlug = params.get("business") ?? "form-and-fade";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(businessSlug) || businessSlug.length > 80) {
    return jsonError("Invalid business.", 400);
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses").select("id").eq("slug", businessSlug).eq("is_active", true).maybeSingle();
  if (businessError || !business) return jsonError("Business is unavailable.", 404);

  const [serviceResult, staffResult] = await Promise.all([
    supabase.from("services").select("id,name,description,duration_minutes,price_cents")
      .eq("business_id", business.id).eq("is_active", true).order("name"),
    supabase.from("staff").select("id,display_name")
      .eq("business_id", business.id).eq("is_active", true).order("display_name"),
  ]);
  if (serviceResult.error || staffResult.error) return jsonError("Could not load the booking options.", 503);

  let slots: Array<{ slot: string }> = [];
  const date = params.get("date");
  const serviceId = params.get("service");
  const staffId = params.get("staff");
  if (date && serviceId && staffId) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !z.string().uuid().safeParse(serviceId).success || !z.string().uuid().safeParse(staffId).success) {
      return jsonError("Invalid date or booking option.", 400);
    }
    const { data, error } = await supabase.rpc("list_available_booking_slots", {
      p_business_slug: businessSlug,
      p_service_id: serviceId,
      p_staff_id: staffId,
      p_local_date: date,
    });
    if (error) return jsonError("Could not load available times.", 503);
    slots = data ?? [];
  }

  return NextResponse.json({ services: serviceResult.data ?? [], staff: staffResult.data ?? [], slots });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return jsonError("Request origin is not allowed.", 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return jsonError("Expected a JSON request.", 415);
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 8_192) return jsonError("Request is too large.", 413);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) return jsonError("Check the booking details and contact information.", 400);
  if (parsed.data.website) return jsonError("The booking could not be accepted.", 400);

  const supabase = adminClient();
  if (!supabase) return jsonError("Online booking is not configured yet.", 503);

  const { data, error } = await supabase.rpc("create_public_booking", {
    p_business_slug: parsed.data.businessSlug,
    p_service_id: parsed.data.serviceId,
    p_staff_id: parsed.data.staffId,
    p_local_start: parsed.data.localStart,
    p_customer_name: parsed.data.customerName,
    p_customer_email: parsed.data.customerEmail || null,
    p_customer_phone: parsed.data.customerPhone || null,
  });

  if (error?.code === "23P01") return jsonError("That time was just booked. Please choose another time.", 409);
  if (error) return jsonError("That time is no longer available. Please choose another time.", 409);
  return NextResponse.json({ bookingId: data, status: "confirmed" }, { status: 201 });
}
