import { Skeleton } from "@/components/ui/primitives/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/primitives/table";

export function TransactionSkeleton() {
  return (
    <div className="w-full space-y-6 bg-white">
      {/* Filter bar skeleton */}
      <div className="bg-white p-4 rounded-lg border border-blue-200 flex flex-wrap gap-4">
        <Skeleton variant="wingull" className="h-10 w-48" />
        <Skeleton variant="wingull" className="h-10 w-48" />
        <Skeleton variant="wingull" className="h-10 w-40 ml-auto" />
      </div>
      
      {/* Table skeleton */}
      <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><Skeleton variant="wingull" className="h-6 w-24" /></TableHead>
              <TableHead><Skeleton variant="wingull" className="h-6 w-32" /></TableHead>
              <TableHead><Skeleton variant="wingull" className="h-6 w-24" /></TableHead>
              <TableHead><Skeleton variant="wingull" className="h-6 w-24" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(10).fill(0).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton variant="wingull" className="h-10 w-10 rounded-full" /></TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Skeleton variant="wingull" className="h-4 w-32" />
                    <Skeleton variant="wingull" className="h-3 w-24" />
                  </div>
                </TableCell>
                <TableCell><Skeleton variant="wingull" className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton variant="wingull" className="h-4 w-24" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination skeleton */}
      <div className="bg-white p-4 rounded-lg border border-blue-200 flex justify-between">
        <Skeleton variant="wingull" className="h-10 w-24" />
        <Skeleton variant="wingull" className="h-6 w-32" />
        <Skeleton variant="wingull" className="h-10 w-24" />
      </div>
    </div>
  );
}