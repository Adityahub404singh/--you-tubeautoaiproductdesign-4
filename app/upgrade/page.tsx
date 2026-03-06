"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, CreditCard } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/lib/auth-context"
import { store } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

declare global {
  interface Window {
    Razorpay: any
  }
}

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

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true)
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePayment = async (plan: (typeof plans)[0]) => {
    if (!user) return
    setLoading(plan.id)

    try {
      const loaded = await loadRazorpay()
      if (!loaded) {
        toast({ title: "Error", description: "Payment gateway load failed!", variant: "destructive" })
        setLoading(null)
        return
      }

      // Create order - using the correct Razorpay create order endpoint
      const orderRes = await fetch("/api/payments/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: plan.price,
          plan: plan.name,
          userId: user.id,
        }),
      })

      const orderData = await orderRes.json()
      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order")
      }

      const { orderId, amount } = orderData

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount,
        currency: "INR",
        name: "YouTubeAuto.ai",
        description: `${plan.name} Plan - ${plan.videos} videos/month`,
        order_id: orderId,
        handler: async (response: any) => {
          // Verify payment
          const verifyRes = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user.id,
              plan: plan.name,
              credits: plan.videos,
            }),
          })

          const result = await verifyRes.json()

          if (result.success) {
            // Update user plan and credits in localStorage
            if (store) {
              const planToCredits: Record<string, number> = {
                "Starter": 20,
                "Pro": 60,
                "Creator": 150,
              }
              const planMap: Record<string, "free" | "pro" | "agency"> = {
                "starter": "pro",
                "pro": "pro",
                "creator": "agency",
              }
              const newCredits = planToCredits[plan.name] || plan.videos
              store.updateUser(user.id, {
                plan: planMap[plan.id] || "pro",
                paidVideoCredits: (user.paidVideoCredits || 0) + newCredits,
                totalSpent: user.totalSpent + plan.price,
              })
            }
            toast({
              title: "Payment Successful! 🎉",
              description: `You are now on ${plan.name} plan with ${plan.videos} video credits!`,
            })
            router.push("/dashboard")
          } else {
            toast({
              title: "Payment Failed",
              description: "Please try again",
              variant: "destructive",
            })
          }
        },
        prefill: {
          email: user.email || "",
          name: user.name || "",
        },
        theme: { color: "#6366f1" },
        modal: {
          ondismiss: () => setLoading(null),
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong!", variant: "destructive" })
    }

    setLoading(null)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background py-12">
        <div className="container px-4 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
            <p className="text-lg text-muted-foreground">
              Upgrade to unlock more videos and features. Cancel anytime.
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
                    onClick={() => handlePayment(plan)}
                    disabled={loading === plan.id}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {loading === plan.id ? "Processing..." : `Pay ₹${plan.price}/mo`}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            🔒 Secure payments via Razorpay • UPI • Cards • Net Banking
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}