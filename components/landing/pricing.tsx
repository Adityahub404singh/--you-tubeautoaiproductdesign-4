import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Free Trial",
    price: "₹0",
    period: "",
    description: "Start with 10 completely free videos",
    features: [
      "First 10 videos FREE",
      "Connect 1 YouTube channel",
      "All AI voices & features",
      "HD video quality (1080p)",
      "Auto-upload to YouTube",
      "Basic analytics dashboard",
    ],
    cta: "Start Free",
    href: "/signup",
    popular: false,
  },
  {
    name: "Pay Per Video",
    price: "$0.20",
    period: "/video",
    description: "Only pay for what you use",
    features: [
      "Videos 11-50: $0.20 each",
      "Videos 51-100: $0.18 each",
      "Videos 101+: $0.16 each",
      "All premium features",
      "Priority video generation",
      "Advanced analytics",
      "Email support",
      "Cancel anytime",
    ],
    cta: "Get Started",
    href: "/signup?plan=payperuse",
    popular: true,
  },
  {
    name: "YouTube Revenue Share",
    price: "10%",
    period: "of YouTube earnings",
    description: "After channel monetization",
    features: [
      "Pay ONLY after monetization",
      "Keep 90% of all earnings",
      "Lifetime partnership",
      "Unlimited videos",
      "Multiple channels",
      "Dedicated account manager",
      "Priority support",
      "Custom branding options",
    ],
    cta: "Learn More",
    href: "/signup?plan=revshare",
    popular: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="container px-4 py-24 lg:px-8 bg-secondary/30">
      <div className="mx-auto max-w-2xl text-center mb-16">
        <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl mb-4 text-balance">Simple, Transparent Pricing</h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Start with 10 free videos. Then pay only for what you use. After monetization, we grow together with 10%
          revenue share.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
        {plans.map((plan, index) => (
          <Card
            key={index}
            className={`relative ${plan.popular ? "border-accent shadow-lg shadow-accent/20" : "border-border"}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
            )}
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant={plan.popular ? "default" : "outline"}>
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-16 max-w-3xl mx-auto text-center">
        <p className="text-sm text-muted-foreground leading-relaxed">
          No subscriptions. No commitments. Start with 10 FREE videos to test quality. Then pay only when you create
          more videos with volume discounts. Once your channel is monetized (1000 subscribers + 4000 watch hours), we
          partner for success with just 10% of your YouTube earnings.
        </p>
      </div>
    </section>
  )
}
