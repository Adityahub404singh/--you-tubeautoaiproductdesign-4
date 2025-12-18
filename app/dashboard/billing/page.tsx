"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, CreditCard } from "lucide-react"

const plans = [
  {
    name: "Free",
    price: "₹0",
    features: ["30 videos/month", "1 channel", "All AI voices", "HD quality"],
  },
  {
    name: "Pro",
    price: "₹1,999",
    features: ["300 videos/month", "5 channels", "Voice cloning", "Priority support"],
    current: true,
  },
  {
    name: "Agency",
    price: "₹7,999",
    features: ["Unlimited videos", "Unlimited channels", "White-label", "API access"],
  },
]

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader selectedChannel="main-channel" onChannelChange={() => {}} />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Billing & Subscription</h1>
            <p className="text-muted-foreground mt-1">Manage your subscription and payment methods</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>You are currently on the Pro plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div>
                  <h3 className="text-lg font-semibold">Pro Plan</h3>
                  <p className="text-sm text-muted-foreground">Next billing date: February 15, 2024</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">₹1,999</p>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>
              </div>
              <Button variant="outline">Cancel Subscription</Button>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan, index) => (
                <Card key={index} className={plan.current ? "border-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{plan.name}</CardTitle>
                      {plan.current && <Badge>Current</Badge>}
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full" variant={plan.current ? "outline" : "default"} disabled={plan.current}>
                      {plan.current ? "Current Plan" : "Upgrade"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Manage your payment information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">Visa ending in 4242</p>
                  <p className="text-sm text-muted-foreground">Expires 12/2025</p>
                </div>
                <Button variant="outline" size="sm">
                  Update
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
