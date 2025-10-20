import { cn } from "@/lib/utils";

const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("animate-shimmer rounded-2xl bg-muted", className)} {...props} />;
};

export { Skeleton };
