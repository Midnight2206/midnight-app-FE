import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function TableSkeleton({ rows = 6, cols = 6 }) {
  return (
    <Card className="surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table min-w-[860px]">
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, idx) => (
                <th key={idx}>
                  <Skeleton className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rIdx) => (
              <tr key={rIdx}>
                {Array.from({ length: cols }).map((__, cIdx) => (
                  <td key={cIdx}>
                    <Skeleton className="h-4 w-full max-w-[180px]" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function CardGridSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, idx) => (
        <Card key={idx} className="surface p-5 space-y-3">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
      ))}
    </div>
  );
}
