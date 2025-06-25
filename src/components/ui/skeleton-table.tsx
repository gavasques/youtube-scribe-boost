
import { Skeleton } from "@/components/ui/skeleton"
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/components/ui/table"

interface SkeletonTableProps {
  columns: number
  rows: number
  showHeader?: boolean
}

export function SkeletonTable({ columns, rows, showHeader = true }: SkeletonTableProps) {
  return (
    <Table>
      {showHeader && (
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-24" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      )}
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
