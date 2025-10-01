import { Skeleton } from "@/components/ui/skeleton";

export default function EventCardSkeleton() {
  return (
    <div className="card-like p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
      <Skeleton className="h-5 w-56" />
      <Skeleton className="h-4 w-40" />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
      <Skeleton className="h-32 w-full" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}
