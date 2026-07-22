import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSectionProps {
  rows?: number;
  rowHeight?: number;
  className?: string;
  lastRowWider?: boolean;
}

export function LoadingSection({
  rows = 3,
  rowHeight = 16,
  className,
  lastRowWider,
}: LoadingSectionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            lastRowWider && i === rows - 1 ? "w-3/4" : "w-full",
          )}
          style={{ height: rowHeight }}
        />
      ))}
    </div>
  );
}

interface LoadingPageProps {
  title?: boolean;
  description?: boolean;
  sections?: number;
  sectionRows?: number;
}

export function LoadingPage({
  title = true,
  description = false,
  sections = 3,
  sectionRows = 2,
}: LoadingPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {title && (
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          {description && <Skeleton className="h-4 w-72" />}
        </div>
      )}
      {Array.from({ length: sections }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <LoadingSection rows={sectionRows} />
        </div>
      ))}
    </div>
  );
}

interface LoadingCardProps {
  lines?: number;
  hasImage?: boolean;
}

export function LoadingCard({ lines = 3, hasImage = true }: LoadingCardProps) {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      {hasImage && <Skeleton className="aspect-[4/3] w-full rounded-none" />}
      <div className="p-4 space-y-3">
        <LoadingSection rows={lines} />
      </div>
    </div>
  );
}

interface LoadingTableProps {
  columns?: number;
  rows?: number;
}

export function LoadingTable({ columns = 4, rows = 6 }: LoadingTableProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-5 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}