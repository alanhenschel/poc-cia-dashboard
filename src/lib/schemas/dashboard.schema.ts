import { z } from "zod";

/**
 * Dashboard create/edit form. `filters` and `layout` are managed separately (filter bar / grid),
 * so the form itself only owns name + tags.
 */
export const dashboardFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be 120 characters or fewer"),
  tags: z
    .array(z.string().trim().min(1).max(40))
    .max(10, "Up to 10 tags"),
});

export type DashboardFormValues = z.infer<typeof dashboardFormSchema>;
