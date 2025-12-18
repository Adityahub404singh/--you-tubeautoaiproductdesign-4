"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

export function UserGrowthChart() {
  const data = [
    { month: "Jul", free: 1200, pro: 180, agency: 25 },
    { month: "Aug", free: 1450, pro: 215, agency: 32 },
    { month: "Sep", free: 1680, pro: 265, agency: 38 },
    { month: "Oct", free: 1920, pro: 310, agency: 45 },
    { month: "Nov", free: 2180, pro: 365, agency: 52 },
    { month: "Dec", free: 2430, pro: 385, agency: 58 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Growth by Plan</CardTitle>
        <CardDescription>User acquisition across different subscription tiers</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="free" stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
            <Line type="monotone" dataKey="pro" stroke="hsl(var(--primary))" strokeWidth={2} />
            <Line type="monotone" dataKey="agency" stroke="hsl(var(--chart-2))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
