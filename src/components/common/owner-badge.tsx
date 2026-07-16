import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { isCurrentUser, ownerHandle } from "@/lib/session";
import { cn } from "@/lib/utils";

interface OwnerBadgeProps {
  ownerId: string;
  className?: string;
}

/** Compact owner label: shows "You" for the current user, otherwise the handle, with initials. */
export function OwnerBadge({ ownerId, className }: OwnerBadgeProps) {
  const mine = isCurrentUser(ownerId);
  const handle = ownerHandle(ownerId);
  const initials = handle.slice(0, 2).toUpperCase();

  return (
    <span className={cn("text-muted-foreground inline-flex items-center gap-1.5 text-sm", className)}>
      <Avatar className="size-5">
        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
      </Avatar>
      <span title={ownerId}>{mine ? "You" : handle}</span>
    </span>
  );
}
