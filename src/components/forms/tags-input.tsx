"use client";

import { X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  id?: string;
  placeholder?: string;
  max?: number;
}

/** Enter/comma to add, Backspace to remove the last tag. De-dupes and trims. */
export function TagsInput({
  value,
  onChange,
  id,
  placeholder = "Add a tag and press Enter",
  max = 10,
}: TagsInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (!tag || value.includes(tag) || value.length >= max) return;
    onChange([...value, tag]);
    setDraft("");
  };

  const removeTag = (tag: string) => onChange(value.filter((t) => t !== tag));

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(draft);
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="border-input focus-within:border-ring focus-within:ring-ring/50 flex flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5 focus-within:ring-[3px]">
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 font-normal">
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            className="hover:text-foreground -mr-0.5"
            onClick={() => removeTag(tag)}
          >
            <X className="size-3" aria-hidden />
          </button>
        </Badge>
      ))}
      <Input
        id={id}
        value={draft}
        placeholder={value.length >= max ? "Tag limit reached" : placeholder}
        disabled={value.length >= max}
        className="h-6 flex-1 border-0 p-0 shadow-none focus-visible:ring-0 min-w-32"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => addTag(draft)}
      />
    </div>
  );
}
