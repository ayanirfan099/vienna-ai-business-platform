import { expect, test } from "@playwright/test";

test("homepage presents the barbershop and primary booking actions", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/FORM & FADE/);
  await expect(page.getByRole("heading", { name: /Guter Schnitt/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Termin vereinbaren/ })).toHaveAttribute("href", "#booking");
  await expect(page.getByRole("heading", { name: /Was wir machen/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Bereit für/ })).toBeVisible();
  await expect(page.getByLabel("Name")).toBeVisible();
  await expect(page.getByLabel("Datum")).toBeVisible();
});

test("legal pages clearly identify their demo placeholder status", async ({ page }) => {
  await page.goto("/datenschutz");
  await expect(page.getByRole("heading", { name: "Datenschutz" })).toBeVisible();
  await expect(page.getByText(/keine fertige Datenschutzerklärung/)).toBeVisible();
});
