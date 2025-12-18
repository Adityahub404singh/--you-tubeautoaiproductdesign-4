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

const videoPacks = [
  {
    id: "pack-5",
    videos: 5,
    price: 1.0,
    priceInr: 83,
    popular: false,
  },
  {
    id: "pack-10",
    videos: 10,
    price: 2.0,
    priceInr: 166,
    popular: true,
  },
  {
    id: "pack-25",
    videos: 27,
    price: 5.0,
    priceInr: 415,
    bonus: 2,
    popular: false,
  },
]

export default function UpgradePage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handlePurchase = async (pack: (typeof videoPacks)[0]) => {
    if (!user || !store) return

    setLoading(true)

    // Simulate payment processing
    setTimeout(() => {
      store.addVideoCredits(user.id, pack.videos, pack.price)

      toast({
        title: "Purchase Successful!",
        description: `${pack.videos} video credits added to your account.`,
      })

      setLoading(false)
      router.push("/dashboard")
    }, 2000)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background py-12">
        <div className="container px-4 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Upgrade Your Account</h1>
            <p className="text-lg text-muted-foreground">
              You've used all 10 free videos. Choose a video pack to continue creating content.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 mb-12">
            {videoPacks.map((pack) => (
              <Card
                key={pack.id}
                className={`relative ${pack.popular ? "border-accent shadow-lg shadow-accent/20" : "border-border"}`}
              >
                {pack.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Best Value
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {pack.videos} Videos{pack.bonus && ` + ${pack.bonus} FREE`}
                  </CardTitle>
                  <CardDescription>
                    {pack.bonus ? `Get ${pack.bonus} bonus videos free` : "Pay per video as you go"}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${pack.price}</span>
                    <span className="text-muted-foreground ml-2">(₹{pack.priceInr})</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    ${(pack.price / pack.videos).toFixed(2)} per video
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      <span className="text-sm">All AI voices & features</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      <span className="text-sm">HD quality (1080p)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      <span className="text-sm">Auto-upload to YouTube</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      <span className="text-sm">Priority generation</span>
                    </li>
                    {pack.bonus && (
                      <li className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-sm font-medium text-accent">{pack.bonus} bonus videos included!</span>
                      </li>
                    )}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={pack.popular ? "default" : "outline"}
                    onClick={() => handlePurchase(pack)}
                    disabled={loading}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {loading ? "Processing..." : "Buy Now"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Payment Methods Accepted</CardTitle>
              <CardDescription>We support multiple payment options for your convenience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
                  <CreditCard className="h-8 w-8" />
                  <span className="text-sm text-center">Credit/Debit Cards</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
                  <CreditCard className="h-8 w-8" />
                  <span className="text-sm text-center">UPI</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
                  <CreditCard className="h-8 w-8" />
                  <span className="text-sm text-center">Net Banking</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
                  <CreditCard className="h-8 w-8" />
                  <span className="text-sm text-center">International</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Secure payments powered by Stripe & Razorpay
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
