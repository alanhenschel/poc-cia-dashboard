"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, X } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FILTER_OPS,
  GROUP_BY_DIMENSIONS,
  MEASUREMENTS,
  METRICS,
  VISUALIZATION_TYPES,
} from "@/constants/charts";
import { chartFormSchema, type ChartFormValues } from "@/lib/schemas/chart.schema";

interface ChartFormProps {
  defaultValues?: Partial<ChartFormValues>;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: ChartFormValues) => void;
  onCancel?: () => void;
}

const EMPTY_QUERY: ChartFormValues["query_definition"] = {
  metric: "screen_viewed",
  measurement: "unique_customers",
  group_by: [],
  filters: [],
};

/** Create/edit form for a standalone Chart, mirroring the RFC `query_definition` shape. */
export function ChartForm({ defaultValues, submitLabel, pending, onSubmit, onCancel }: ChartFormProps) {
  const form = useForm<ChartFormValues>({
    resolver: zodResolver(chartFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      visualization_type: defaultValues?.visualization_type ?? "line",
      query_definition: defaultValues?.query_definition ?? EMPTY_QUERY,
    },
  });

  const filters = useFieldArray({ control: form.control, name: "query_definition.filters" });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chart name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Sign-up completion by platform" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="query_definition.metric"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Metric</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {METRICS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="query_definition.measurement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Measurement</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MEASUREMENTS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="visualization_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Visualization</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {VISUALIZATION_TYPES.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="query_definition.group_by"
          render={({ field }) => {
            const toggle = (dimension: string) =>
              field.onChange(
                field.value.includes(dimension)
                  ? field.value.filter((d) => d !== dimension)
                  : [...field.value, dimension],
              );
            return (
              <FormItem>
                <FormLabel>Break down by</FormLabel>
                <div className="flex flex-wrap gap-1.5">
                  {GROUP_BY_DIMENSIONS.map((dimension) => {
                    const active = field.value.includes(dimension.value);
                    return (
                      <Button
                        key={dimension.value}
                        type="button"
                        size="sm"
                        variant={active ? "default" : "outline"}
                        aria-pressed={active}
                        onClick={() => toggle(dimension.value)}
                      >
                        {dimension.label}
                      </Button>
                    );
                  })}
                </div>
              </FormItem>
            );
          }}
        />

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Filters</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => filters.append({ property: "", op: "eq", value: "" })}
            >
              <Plus className="size-3.5" aria-hidden />
              Add filter
            </Button>
          </div>

          {filters.fields.length === 0 ? (
            <p className="text-muted-foreground text-xs">No property filters. The chart returns all events for the metric.</p>
          ) : (
            <div className="grid gap-2">
              {filters.fields.map((fieldItem, index) => (
                <div key={fieldItem.id} className="flex items-start gap-2">
                  <Input
                    aria-label="Property"
                    placeholder="property (e.g. screen_name)"
                    className="flex-1"
                    {...form.register(`query_definition.filters.${index}.property`)}
                  />
                  <FormField
                    control={form.control}
                    name={`query_definition.filters.${index}.op`}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-28" aria-label="Operator">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FILTER_OPS.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <Input
                    aria-label="Value"
                    placeholder="value"
                    className="flex-1"
                    {...form.register(`query_definition.filters.${index}.value`)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove filter"
                    onClick={() => filters.remove(index)}
                  >
                    <X className="size-4" aria-hidden />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

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
