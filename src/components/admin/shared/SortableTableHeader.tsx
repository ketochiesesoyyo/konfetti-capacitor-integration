import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";

interface SortIconProps {
  column: string;
  currentSort: string;
  currentDir: 'asc' | 'desc';
}

export const SortIcon = ({ column, currentSort, currentDir }: SortIconProps) => {
  if (column !== currentSort) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
  return currentDir === 'asc' ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />;
};

interface SortableTableHeaderProps<T extends string> {
  column: T;
  label: string;
  sortBy: T;
  sortDir: 'asc' | 'desc';
  onSort: (column: T) => void;
}

export function SortableTableHeader<T extends string>({
  column,
  label,
  sortBy,
  sortDir,
  onSort,
}: SortableTableHeaderProps<T>) {
  return (
    <TableHead
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center">
        {label}
        <SortIcon column={column} currentSort={sortBy} currentDir={sortDir} />
      </div>
    </TableHead>
  );
}
