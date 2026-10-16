import { describe, expect, it } from "vitest";
import { business, services } from "./business";

describe("fictional business starter content", () => {
  it("identifies itself as the demo business and has local contact information", () => {
    expect(business.name).toBe("FORM & FADE");
    expect(business.address).toContain("1070 Wien");
    expect(business.phone).toMatch(/^\+43/);
  });

  it("keeps service prices and durations present", () => {
    expect(services.length).toBeGreaterThanOrEqual(3);
    for (const service of services) {
      expect(service.price).toMatch(/^€\s\d+/);
      expect(service.duration).toMatch(/^\d+ MIN$/);
    }
  });
});
