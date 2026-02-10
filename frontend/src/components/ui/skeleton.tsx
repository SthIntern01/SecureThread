import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md",
        // Light mode: subtle gray
        "bg-gray-200/80",
        // Dark mode: subtle white to match your theme
        "dark:bg-white/10",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }