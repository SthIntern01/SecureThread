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

const alertsData = [
  { severity: "critical", count: 5, fill: "var(--color-critical)" },
  { severity: "high", count: 4, fill: "var(--color-high)" },
  { severity: "medium", count: 3, fill: "var(--color-medium)" },
  { severity: "low", count: 0, fill: "var(--color-low)" },
]

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

export function SecurityAlertsPieChart() {
  const id = "security-alerts-pie"
  const [activeSeverity, setActiveSeverity] = React.useState(alertsData[0].severity)
  const activeIndex = React.useMemo(
    () => alertsData.findIndex((item) => item.severity === activeSeverity),
    [activeSeverity]
  )
  const severities = React.useMemo(() => alertsData.map((item) => item.severity), [])
  const totalAlerts = React.useMemo(() => alertsData.reduce((sum, item) => sum + item.count, 0), [])

  return (
    <div className="flex flex-col bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20">
      <ChartStyle id={id} config={chartConfig} />
      <div className="flex-row items-start space-y-0 pb-0 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Security Alerts</h3>
          </div>
          <span className="text-sm text-red-400 font-medium">{totalAlerts}</span>
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
                          {alertsData[activeIndex].count.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 18}
                          className="fill-white/70 text-xs"
                        >
                          {chartConfig[alertsData[activeIndex].severity as keyof typeof chartConfig]?.label}
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