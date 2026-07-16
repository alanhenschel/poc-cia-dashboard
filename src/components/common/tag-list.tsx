import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagListProps {
  tags: string[];
  className?: string;
  max?: number;
}

/** Renders tags as subtle badges, collapsing overflow into a "+N" pill. */
export function TagList({ tags, className, max = 4 }: TagListProps) {
  if (tags.length === 0) return null;
  const visible = tags.slice(0, max);
  const overflow = tags.length - visible.length;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {visible.map((tag) => (
        <Badge key={tag} variant="secondary" className="font-normal">
          {tag}
        </Badge>
      ))}
      {overflow > 0 ? (
        <Badge variant="outline" className="font-normal">
          +{overflow}
        </Badge>
      ) : null}
    </div>
  );
}
