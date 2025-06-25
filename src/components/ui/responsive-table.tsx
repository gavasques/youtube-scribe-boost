
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Column {
  key: string
  label: string
  className?: string
  render?: (value: any, row: any) => React.ReactNode
}

interface ResponsiveTableProps {
  columns: Column[]
  data: any[]
  className?: string
  mobileBreakpoint?: string
}

export function ResponsiveTable({ 
  columns, 
  data, 
  className,
  mobileBreakpoint = "md" 
}: ResponsiveTableProps) {
  return (
    <>
      {/* Desktop Table */}
      <div className={cn(`hidden ${mobileBreakpoint}:block`, className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className={cn(`${mobileBreakpoint}:hidden space-y-4`, className)}>
        {data.map((row, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              {columns.map((column) => (
                <div key={column.key} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <span className="font-medium text-sm text-muted-foreground">
                    {column.label}
                  </span>
                  <span className="text-right">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
