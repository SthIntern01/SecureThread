import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md",
        // Shimmer animation
        "animate-shimmer bg-gradient-to-r",
        "from-gray-200/80 via-gray-100/80 to-gray-200/80",
        "dark:from-white/10 dark:via-white/20 dark:to-white/10",
        "bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }