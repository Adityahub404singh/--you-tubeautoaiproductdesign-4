content = """\
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, CreditCard, Loader2 } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { store } from "@/lib/store"

const plans = [
  { id: "starter", name: "Starter", price: 499, videos: 20, credits: 20, description: "Perfect for small creators", color: "border-green-500", popular: false, features: ["20 videos per month","Daily limit: 3 videos","1080p quality","No watermark","Auto post YouTube"] },
  { id: "pro", name: "Pro", price: 999, videos: 60, credits: 60, description: "For growing creators", color: "border-blue-500", popular: true, features: ["60 videos per month","Daily limit: 8 videos","Premium AI voice","Bulk scheduling","Analytics dashboard"] },
  { id: "creator", name: "Creator", price: 1999, videos: 150, credits: 150, description: "For agencies", color: "border-red-500", popular: false, features: ["150 videos per month","Daily limit: 15 videos","Fast rendering","Priority processing","Dedicated manager"] },
]

declare global { interface Window { Razorpay: any } }

export default function UpgradePage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  const handlePurchase = async (plan: typeof plans[0]) => {
    if (!user) return
    setLoading(plan.id)
    try {
      const res = await fetch("/api/payments/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: plan.price, plan: plan.id, userId: user.id })
      })
      const order = await res.json()
      if (!order.success) throw new Error(order.error)
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "YouTubeAuto.ai",
        description: plan.name + " Plan",
        order_id: order.orderId,
        prefill: { name: user.name, email: user.email, contact: user.phone },
        theme: { color: "#6366f1" },
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature, userId: user.id, plan: plan.id, credits: plan.credits })
          })
          const verify = await verifyRes.json()
          if (verify.success) {
            store?.addVideoCredits(user.id, plan.credits, plan.price)
            store?.updateUser(user.id, { plan: plan.id as any })
            toast({ title: "Payment Successful!", description: plan.name + " plan activated!" })
            router.push("/dashboard")
          }
        },
        modal: { ondismiss: () => setLoading(null) }
      }
      new window.Razorpay(options).open()
    } catch (err: any) {
      toast({ title: "Payment Failed", description: err.message, variant: "destructive" })
      setLoading(null)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background py-12">
        <div className="container px-4 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
            <p className="text-lg text-muted-foreground">Upgrade to unlock more videos. Cancel anytime.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 mb-12">
            {plans.map((plan) => (
              <Card key={plan.id} className={"relative border-2 " + plan.color}>
                {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm">Most Popular</div>}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4"><span className="text-4xl font-bold">Rs.{plan.price}</span><span className="text-muted-foreground">/mo</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">{plan.features.map((f,i) => <li key={i} className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5" /><span className="text-sm">{f}</span></li>)}</ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"} onClick={() => handlePurchase(plan)} disabled={loading === plan.id}>
                    {loading === plan.id ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : <><CreditCard className="mr-2 h-4 w-4" />Subscribe Rs.{plan.price}/mo</>}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
"""

with open("app/upgrade/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
