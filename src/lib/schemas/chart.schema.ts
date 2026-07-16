import { z } from "zod";

/** One property filter inside a chart's query definition (context.md query_definition.filters[]). */
export const queryFilterSchema = z.object({
  property: z.string().trim().min(1, "Property is required"),
  op: z.enum(["eq", "neq", "in", "contains"]),
  value: z.string().trim().min(1, "Value is required"),
});

/**
 * Chart create/edit form. Mirrors the RFC `query_definition` shape so the values map straight
 * onto the POST/PATCH /api/charts body with no translation.
 */
export const chartFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be 120 characters or fewer"),
  visualization_type: z.enum(["line", "bar", "area"]),
  query_definition: z.object({
    metric: z.string().min(1, "Pick a metric"),
    measurement: z.string().min(1, "Pick a measurement"),
    group_by: z.array(z.string()),
    filters: z.array(queryFilterSchema),
  }),
});

export type ChartFormValues = z.infer<typeof chartFormSchema>;
