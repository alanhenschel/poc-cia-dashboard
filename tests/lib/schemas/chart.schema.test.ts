import { describe, expect, it } from "vitest";
import { chartFormSchema, queryFilterSchema } from "@/lib/schemas/chart.schema";

const validChart = {
  name: "Sign-ups",
  visualization_type: "line" as const,
  query_definition: {
    metric: "screen_viewed",
    measurement: "unique_customers",
    group_by: ["platform"],
    filters: [{ property: "screen_name", op: "eq" as const, value: "signup_completed" }],
  },
};

describe("queryFilterSchema", () => {
  it("accepts a well-formed property filter", () => {
    expect(queryFilterSchema.safeParse({ property: "country", op: "eq", value: "br" }).success).toBe(true);
  });

  it("rejects an empty property or value, and an unknown op", () => {
    expect(queryFilterSchema.safeParse({ property: "", op: "eq", value: "br" }).success).toBe(false);
    expect(queryFilterSchema.safeParse({ property: "country", op: "eq", value: "" }).success).toBe(false);
    expect(queryFilterSchema.safeParse({ property: "country", op: "like", value: "br" }).success).toBe(false);
  });
});

describe("chartFormSchema", () => {
  it("accepts a complete valid chart", () => {
    expect(chartFormSchema.safeParse(validChart).success).toBe(true);
  });

  it("accepts empty group_by and filters", () => {
    const result = chartFormSchema.safeParse({
      ...validChart,
      query_definition: { ...validChart.query_definition, group_by: [], filters: [] },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(chartFormSchema.safeParse({ ...validChart, name: "  " }).success).toBe(false);
  });

  it("rejects an unknown visualization_type", () => {
    expect(chartFormSchema.safeParse({ ...validChart, visualization_type: "pie" }).success).toBe(false);
  });

  it("rejects a missing metric or measurement", () => {
    expect(
      chartFormSchema.safeParse({
        ...validChart,
        query_definition: { ...validChart.query_definition, metric: "" },
      }).success,
    ).toBe(false);
    expect(
      chartFormSchema.safeParse({
        ...validChart,
        query_definition: { ...validChart.query_definition, measurement: "" },
      }).success,
    ).toBe(false);
  });

  it("rejects a malformed filter inside the query definition", () => {
    const result = chartFormSchema.safeParse({
      ...validChart,
      query_definition: {
        ...validChart.query_definition,
        filters: [{ property: "", op: "eq", value: "x" }],
      },
    });
    expect(result.success).toBe(false);
  });
});
