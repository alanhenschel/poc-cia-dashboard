"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { dashboardFormSchema, type DashboardFormValues } from "@/lib/schemas/dashboard.schema";
import { TagsInput } from "./tags-input";

interface DashboardFormProps {
  defaultValues?: Partial<DashboardFormValues>;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: DashboardFormValues) => void;
  onCancel?: () => void;
}

/** Create/edit form for a Dashboard's name + tags (RHF + zod). Filters/layout are edited elsewhere. */
export function DashboardForm({
  defaultValues,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: DashboardFormProps) {
  const form = useForm<DashboardFormValues>({
    resolver: zodResolver(dashboardFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      tags: defaultValues?.tags ?? [],
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Onboarding funnel — Q2" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <TagsInput value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>Used for search and grouping. Optional.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel ? (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
