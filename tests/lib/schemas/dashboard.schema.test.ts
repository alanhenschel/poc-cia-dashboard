import { describe, expect, it } from "vitest";
import { dashboardFormSchema } from "@/lib/schemas/dashboard.schema";

describe("dashboardFormSchema", () => {
  it("accepts a valid name + tags", () => {
    const result = dashboardFormSchema.safeParse({ name: "Onboarding funnel", tags: ["onboarding"] });
    expect(result.success).toBe(true);
  });

  it("trims the name and accepts empty tags", () => {
    const result = dashboardFormSchema.safeParse({ name: "  Growth  ", tags: [] });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Growth");
  });

  it("rejects an empty name", () => {
    expect(dashboardFormSchema.safeParse({ name: "   ", tags: [] }).success).toBe(false);
  });

  it("rejects a name over 120 chars", () => {
    expect(dashboardFormSchema.safeParse({ name: "a".repeat(121), tags: [] }).success).toBe(false);
  });

  it("rejects more than 10 tags", () => {
    const tags = Array.from({ length: 11 }, (_, i) => `t${i}`);
    expect(dashboardFormSchema.safeParse({ name: "x", tags }).success).toBe(false);
  });
});
