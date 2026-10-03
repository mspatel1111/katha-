import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return <main className="state-page" aria-busy="true" aria-label="Loading KATHA"><Skeleton className="h-12 w-48" /><div className="loading-grid">{[1,2,3,4].map(id => <Skeleton key={id} className="h-80 w-full" />)}</div><p role="status">Loading your collection…</p></main>;
}
