"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";

type Service = { id: string; name: string; description: string; duration_minutes: number; price_cents: number };
type Staff = { id: string; display_name: string };
type Catalog = { services: Service[]; staff: Staff[]; slots: { slot: string }[] };

function viennaDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Vienna", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function slotLabel(slot: string) {
  return new Intl.DateTimeFormat("de-AT", {
    timeZone: "Europe/Vienna", hour: "2-digit", minute: "2-digit",
  }).format(new Date(slot));
}

export function BookingForm() {
  const [catalog, setCatalog] = useState<Catalog>({ services: [], staff: [], slots: [] });
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(viennaDate);
  const [slot, setSlot] = useState("");
  const [contactType, setContactType] = useState<"phone" | "email">("phone");
  const [state, setState] = useState<"loading" | "ready" | "sending" | "done" | "error">("loading");
  const [message, setMessage] = useState("");
  const selectedService = useMemo(() => catalog.services.find((item) => item.id === serviceId), [catalog.services, serviceId]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ business: "form-and-fade" });
    if (date && serviceId && staffId) {
      params.set("date", date);
      params.set("service", serviceId);
      params.set("staff", staffId);
    }
    fetch(`/api/booking?${params}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Booking options are unavailable.");
        return result as Catalog;
      })
      .then((data) => {
        if (!active) return;
        setCatalog(data);
        setServiceId((current) => current || data.services[0]?.id || "");
        setStaffId((current) => current || data.staff[0]?.id || "");
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState("error");
        setMessage(error instanceof Error ? error.message : "Online booking is not available right now.");
      });
    return () => { active = false; };
  }, [date, serviceId, staffId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const chosen = new Date(slot);
    const localStart = `${date}T${new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Vienna", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).format(chosen)}:00`;
    setState("sending");
    setMessage("");
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessSlug: "form-and-fade", serviceId, staffId, localStart,
          customerName: form.get("name"),
          customerEmail: contactType === "email" ? form.get("contact") : "",
          customerPhone: contactType === "phone" ? form.get("contact") : "",
          website: form.get("website"),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Booking failed.");
      setState("done");
      setMessage("Dein Termin ist bestätigt. Wir freuen uns auf dich.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Der Termin konnte nicht gebucht werden.");
    }
  }

  return (
    <form className="booking-form" onSubmit={submit} aria-describedby="booking-status">
      {state === "done" ? (
        <div className="booking-success" role="status"><Check aria-hidden="true" /><p>{message}</p></div>
      ) : (
        <>
          <div className="booking-fields">
            <label>Leistung
              <select required value={serviceId} onChange={(event) => { setState("loading"); setServiceId(event.target.value); setSlot(""); }} disabled={!catalog.services.length}>
                {catalog.services.map((service) => <option key={service.id} value={service.id}>{service.name} · {service.duration_minutes} Min. · € {(service.price_cents / 100).toFixed(2)}</option>)}
              </select>
            </label>
            <label>Barber
              <select required value={staffId} onChange={(event) => { setState("loading"); setStaffId(event.target.value); setSlot(""); }} disabled={!catalog.staff.length}>
                {catalog.staff.map((staff) => <option key={staff.id} value={staff.id}>{staff.display_name}</option>)}
              </select>
            </label>
            <label>Datum
              <input type="date" required min={viennaDate()} value={date} onChange={(event) => { setState("loading"); setDate(event.target.value); setSlot(""); }} />
            </label>
            <fieldset className="slot-fieldset">
              <legend>Freie Zeiten {selectedService ? `· ${selectedService.duration_minutes} Min.` : ""}</legend>
              {catalog.slots.length ? <div className="slot-grid">{catalog.slots.map(({ slot: value }) => <button type="button" className={slot === value ? "slot-option selected" : "slot-option"} aria-pressed={slot === value} key={value} onClick={() => setSlot(value)}>{slotLabel(value)}</button>)}</div> : <p className="no-slots">{state === "loading" ? "Zeiten werden geladen …" : "An diesem Tag sind keine freien Zeiten verfügbar."}</p>}
            </fieldset>
            <label>Name<input name="name" autoComplete="name" maxLength={120} required /></label>
            <div className="contact-row"><label>Kontakt per<select value={contactType} onChange={(event) => setContactType(event.target.value as "phone" | "email")}><option value="phone">Telefon</option><option value="email">E-Mail</option></select></label><label>{contactType === "phone" ? "Telefonnummer" : "E-Mail-Adresse"}<input name="contact" type={contactType === "phone" ? "tel" : "email"} autoComplete={contactType === "phone" ? "tel" : "email"} maxLength={254} required /></label></div>
            <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
          </div>
          <p id="booking-status" className="booking-form-status" role="status" aria-live="polite">{message || (state === "loading" ? "Buchungsoptionen werden geladen …" : "Deine Kontaktdaten werden nur für diesen Termin verwendet.")}</p>
          <button className="button button-dark booking-submit" type="submit" disabled={state === "loading" || state === "sending" || !slot}>
            {state === "sending" ? <><LoaderCircle size={16} className="spinner" /> Wird gebucht …</> : <>Termin verbindlich buchen <ArrowRight size={16} /></>}
          </button>
        </>
      )}
    </form>
  );
}
