"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, CreditCard } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 499,
    period: "/month",
    videos: 20,
    dailyLimit: 3,
    description: "Perfect for small creators",
    color: "border-green-500",
    popular: false,
    features: [
      "20 videos per month",
      "Daily limit: 3 videos",
      "1080p export quality",
      "No watermark",
      "Auto post YouTube + Instagram",
      "1 YouTube + 1 Instagram account",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 999,
    period: "/month",
    videos: 60,
    dailyLimit: 8,
    description: "For growing creators",
    color: "border-blue-500",
    popular: true,
    features: [
      "60 videos per month",
      "Daily limit: 8 videos",
      "Premium AI voice",
      "Bulk scheduling",
      "Analytics dashboard",
      "2 YouTube + 2 Instagram accounts",
    ],
  },
  {
    id: "creator",
    name: "Creator",
    price: 1999,
    period: "/month",
    videos: 150,
    dailyLimit: 15,
    description: "For agencies & heavy users",
    color: "border-red-500",
    popular: false,
    features: [
      "150 videos per month",
      "Daily limit: 15 videos",
      "Fast rendering queue",
      "Priority processing",
      "5 YouTube + 5 Instagram accounts",
      "Dedicated account manager",
    ],
  },
]

export default function UpgradePage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const handlePurchase = async (plan: (typeof plans)[0]) => {
    if (!user) return
    setLoading(plan.id)

    setTimeout(() => {
      toast({
        title: "Subscription Activated!",
        description: `You are now on the ${plan.name} plan. Enjoy ${plan.videos} videos/month!`,
      })
      setLoading(null)
      router.push("/dashboard")
    }, 2000)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background py-12">
        <div className="container px-4 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
            <p className="text-lg text-muted-foreground">
              Upgrade to unlock more videos, features and accounts. Cancel anytime.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 mb-12">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${plan.popular ? `${plan.color} shadow-lg shadow-blue-500/20` : plan.color}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">₹{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.videos} videos/month • {plan.dailyLimit} videos/day max
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handlePurchase(plan)}
                    disabled={loading === plan.id}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {loading === plan.id ? "Processing..." : `Subscribe ₹${plan.price}/mo`}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Payment Methods Accepted</CardTitle>
              <CardDescription>Secure payments via Razorpay</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["Credit/Debit Cards", "UPI", "Net Banking", "International"].map((method) => (
                  <div key={method} className="flex flex-col items-center gap-2 p-4 border rounded-lg">
                    <CreditCard className="h-8 w-8" />
                    <span className="text-sm text-center">{method}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                🔒 Secure payments via Razorpay
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}