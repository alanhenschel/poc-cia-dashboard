"use client";

import { Loader2, RotateCcw, Save } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  COUNTRIES,
  COUNTRY_ANY,
  DATE_RANGE_PRESETS,
  PLATFORMS,
} from "@/constants/filters";
import { appVersionSchema } from "@/lib/schemas/filters.schema";
import { cn } from "@/lib/utils";
import type {
  Country,
  DashboardFilters,
  DateRangePreset,
  Platform,
} from "@/types";

interface GlobalFilterBarProps {
  filters: DashboardFilters;
  savedFilters: DashboardFilters;
  canMutate: boolean;
  savePending: boolean;
  onChange: (filters: DashboardFilters) => void;
  onSaveDefault: (filters: DashboardFilters) => void;
}

function serialize(filters: DashboardFilters): string {
  return JSON.stringify(filters);
}

/**
 * The single global dashboard filter (RFC: one filter set for every widget). Changes re-run the
 * results query immediately; an owner can persist the current selection as the dashboard default.
 */
export function GlobalFilterBar({
  filters,
  savedFilters,
  canMutate,
  savePending,
  onChange,
  onSaveDefault,
}: GlobalFilterBarProps) {
  const [versionInput, setVersionInput] = useState(filters.app_version_min ?? "");
  const [versionError, setVersionError] = useState<string | null>(null);

  const dirty = serialize(filters) !== serialize(savedFilters);

  const setPreset = (preset: DateRangePreset) =>
    onChange({ ...filters, date_range: { preset } });

  const togglePlatform = (platform: Platform) => {
    const active = filters.platform.includes(platform);
    const next = active
      ? filters.platform.filter((p) => p !== platform)
      : [...filters.platform, platform];
    onChange({ ...filters, platform: next });
  };

  const setCountry = (value: string) =>
    onChange({
      ...filters,
      country: value === COUNTRY_ANY ? null : (value as Country),
    });

  const commitVersion = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === "") {
      setVersionError(null);
      onChange({ ...filters, app_version_min: null });
      return;
    }
    const parsed = appVersionSchema.safeParse(trimmed);
    if (!parsed.success) {
      setVersionError(parsed.error.issues[0]?.message ?? "Invalid version");
      return;
    }
    setVersionError(null);
    onChange({ ...filters, app_version_min: trimmed });
  };

  const reset = () => {
    setVersionInput(savedFilters.app_version_min ?? "");
    setVersionError(null);
    onChange(savedFilters);
  };

  return (
    <div className="bg-muted/40 flex flex-wrap items-end gap-3 rounded-xl border p-3">
      <div className="grid gap-1.5">
        <Label className="text-muted-foreground text-xs">Date range</Label>
        <Select value={filters.date_range.preset} onValueChange={setPreset}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGE_PRESETS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-muted-foreground text-xs">Platform</Label>
        <div className="flex gap-1" role="group" aria-label="Platform filter">
          {PLATFORMS.map((platform) => {
            const active = filters.platform.includes(platform.value);
            return (
              <Button
                key={platform.value}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                aria-pressed={active}
                onClick={() => togglePlatform(platform.value)}
              >
                {platform.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-muted-foreground text-xs">Country</Label>
        <Select value={filters.country ?? COUNTRY_ANY} onValueChange={setCountry}>
          <SelectTrigger size="sm" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={COUNTRY_ANY}>Any country</SelectItem>
            {COUNTRIES.map((country) => (
              <SelectItem key={country.value} value={country.value}>
                {country.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="app-version-min" className="text-muted-foreground text-xs">
          Min app version
        </Label>
        <Input
          id="app-version-min"
          value={versionInput}
          placeholder="5.42.0"
          inputMode="numeric"
          aria-invalid={versionError ? true : undefined}
          aria-describedby={versionError ? "app-version-error" : undefined}
          className={cn("h-8 w-32", versionError && "border-destructive")}
          onChange={(e) => {
            setVersionInput(e.target.value);
            commitVersion(e.target.value);
          }}
        />
        {versionError ? (
          <span id="app-version-error" className="text-destructive text-xs">
            {versionError}
          </span>
        ) : null}
      </div>

      {dirty ? (
        <div className="ml-auto flex items-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="size-3.5" aria-hidden />
            Reset
          </Button>
          {canMutate ? (
            <Button
              type="button"
              size="sm"
              disabled={savePending}
              onClick={() => onSaveDefault(filters)}
            >
              {savePending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Save className="size-3.5" aria-hidden />
              )}
              Save as default
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
