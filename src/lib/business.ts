export const business = {
  name: "FORM & FADE",
  descriptor: "BARBER ATELIER · WIEN",
  address: "Neubaugasse 28, 1070 Wien",
  phone: "+43 1 523 18 09",
  hours: ["Di–Fr · 10:00–19:00", "Sa · 09:00–16:00", "Mo & So · geschlossen"],
  bookingUrl: "#booking",
} as const;

export const services = [
  { name: "Der klassische Schnitt", detail: "Beratung, Schnitt & Styling", duration: "45 MIN", price: "€ 42" },
  { name: "Skin Fade", detail: "Präziser Fade, sauber ausgearbeitet", duration: "45 MIN", price: "€ 45" },
  { name: "Schnitt & Bart", detail: "Komplett gepflegt, von Kopf bis Kinn", duration: "60 MIN", price: "€ 62" },
] as const;
