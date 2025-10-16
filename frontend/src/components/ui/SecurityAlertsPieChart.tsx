import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
import { PieSectorDataItem } from "recharts/types/polar/Pie"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Zap } from "lucide-react"

interface SecurityAlertsPieChartProps {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

const chartConfig = {
  count: {
    label: "Alerts",
  },
  critical: {
    label: "Critical",
    color: "#ef4444",
  },
  high: {
    label: "High", 
    color: "#f97316",
  },
  medium: {
    label: "Medium",
    color: "#eab308",
  },
  low: {
    label: "Low",
    color: "#6b7280",
  },
} satisfies ChartConfig

export function SecurityAlertsPieChart({ critical, high, medium, low }: SecurityAlertsPieChartProps) {
  const id = "security-alerts-pie"
  
  // Use dynamic data from props
  const alertsData = React.useMemo(() => [
    { severity: "critical", count: critical, fill: "var(--color-critical)" },
    { severity: "high", count: high, fill: "var(--color-high)" },
    { severity: "medium", count: medium, fill: "var(--color-medium)" },
    { severity: "low", count: low, fill: "var(--color-low)" },
  ], [critical, high, medium, low])

  const [activeSeverity, setActiveSeverity] = React.useState(alertsData[0].severity)
  const activeIndex = React.useMemo(
    () => alertsData.findIndex((item) => item.severity === activeSeverity),
    [activeSeverity, alertsData]
  )
  const severities = React.useMemo(() => alertsData.map((item) => item.severity), [alertsData])
  const totalAlerts = React.useMemo(() => alertsData.reduce((sum, item) => sum + item.count, 0), [alertsData])

  // Update active severity when data changes
  React.useEffect(() => {
    // Find the first severity that has alerts, or default to critical
    const firstSeverityWithAlerts = alertsData.find(item => item.count > 0)?.severity || "critical"
    setActiveSeverity(firstSeverityWithAlerts)
  }, [alertsData])

  // If no alerts, show empty state
  if (totalAlerts === 0) {
    return (
      <div className="flex flex-col bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20">
        <ChartStyle id={id} config={chartConfig} />
        <div className="flex-row items-start space-y-0 pb-0 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Security Alerts</h3>
            </div>
            <span className="text-sm text-green-400 font-medium">0</span>
          </div>
        </div>
        <div className="flex flex-1 justify-center items-center pb-4 min-h-[200px]">
          <div className="text-center text-white/60">
            <div className="text-lg mb-2">No Vulnerabilities</div>
            <div className="text-sm">All scans clean!</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20">
      <ChartStyle id={id} config={chartConfig} />
      <div className="flex-row items-start space-y-0 pb-0 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Security Alerts</h3>
          </div>
          <span className={`text-sm font-medium ${
            totalAlerts > 0 ? "text-red-400" : "text-green-400"
          }`}>
            {totalAlerts}
          </span>
        </div>
        <Select value={activeSeverity} onValueChange={setActiveSeverity}>
          <SelectTrigger
            className="ml-auto h-7 w-[130px] rounded-lg pl-2.5 bg-white/10 border-white/20 text-white text-xs"
            aria-label="Select severity"
          >
            <SelectValue placeholder="Select severity" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-xl bg-slate-800 border-slate-600">
            {severities.map((key) => {
              const config = chartConfig[key as keyof typeof chartConfig]
              if (!config) {
                return null
              }
              return (
                <SelectItem
                  key={key}
                  value={key}
                  className="rounded-lg [&_span]:flex text-white hover:bg-slate-700"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="flex h-3 w-3 shrink-0 rounded-xs"
                      style={{
                        backgroundColor: `var(--color-${key})`,
                      }}
                    />
                    {config?.label}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-1 justify-center pb-4">
        <ChartContainer
          id={id}
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[200px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={alertsData}
              dataKey="count"
              nameKey="severity"
              innerRadius={45}
              strokeWidth={3}
              activeIndex={activeIndex}
              activeShape={({
                outerRadius = 0,
                ...props
              }: PieSectorDataItem) => (
                <g>
                  <Sector {...props} outerRadius={outerRadius + 8} />
                  <Sector
                    {...props}
                    outerRadius={outerRadius + 20}
                    innerRadius={outerRadius + 10}
                  />
                </g>
              )}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-white text-2xl font-bold"
                        >
                          {alertsData[activeIndex]?.count.toLocaleString() || 0}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 18}
                          className="fill-white/70 text-xs"
                        >
                          {chartConfig[alertsData[activeIndex]?.severity as keyof typeof chartConfig]?.label || "Critical"}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </div>
    </div>
  )
}