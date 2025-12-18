"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, AlertCircle, Clock } from "lucide-react"

export function SystemHealth() {
  const services = [
    { name: "API Server", status: "operational", uptime: "99.9%" },
    { name: "Video Generation", status: "operational", uptime: "99.7%" },
    { name: "YouTube Upload", status: "operational", uptime: "99.8%" },
    { name: "Database", status: "operational", uptime: "100%" },
    { name: "TTS Service", status: "degraded", uptime: "98.5%" },
    { name: "Storage", status: "operational", uptime: "99.9%" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health</CardTitle>
        <CardDescription>Service status and uptime</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="space-y-1">
                <p className="text-sm font-medium">{service.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{service.uptime} uptime</span>
                </div>
              </div>
              <div>
                {service.status === "operational" ? (
                  <div className="flex items-center gap-1 text-green-500 text-xs">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Operational</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-yellow-500 text-xs">
                    <AlertCircle className="h-4 w-4" />
                    <span>Degraded</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
