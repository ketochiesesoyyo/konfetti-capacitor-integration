import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  value: number | string;
  label: string;
  valueColor?: string;
}

export const StatsCard = ({ value, label, valueColor }: StatsCardProps) => {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className={cn("text-2xl font-bold", valueColor)}>{value}</div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
};
