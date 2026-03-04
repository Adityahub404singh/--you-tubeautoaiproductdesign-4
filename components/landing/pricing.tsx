import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "/month",
    description: "Perfect to get started",
    features: [
      "2 videos per month",
      "720p export quality",
      "Watermark on videos",
      "1 YouTube channel",
      "Basic AI script",
      "No bulk scheduling",
    ],
    cta: "Start Free",
    href: "/signup",
    popular: false,
    color: "border-border",
  },
  {
    name: "Starter",
    price: "₹499",
    period: "/month",
    description: "Perfect for small creators",
    features: [
      "20 videos per month",
      "1080p export quality",
      "No watermark",
      "Auto post YouTube + Instagram",
      "Basic AI voice",
      "1 YouTube + 1 Instagram account",
    ],
    cta: "Get Started",
    href: "/signup?plan=starter",
    popular: false,
    color: "border-green-500",
  },
  {
    name: "Pro",
    price: "₹999",
    period: "/month",
    description: "For growing creators",
    features: [
      "60 videos per month",
      "Premium AI voice",
      "Bulk scheduling",
      "Analytics dashboard",
      "2 YouTube + 2 Instagram accounts",
      "Priority support",
    ],
    cta: "Go Pro",
    href: "/signup?plan=pro",
    popular: true,
    color: "border-blue-500",
  },
  {
    name: "Creator",
    price: "₹1999",
    period: "/month",
    description: "For agencies & heavy users",
    features: [
      "150 videos per month",
      "Fast rendering queue",
      "Priority processing",
      "5 YouTube + 5 Instagram accounts",
      "Advanced analytics",
      "Dedicated account manager",
    ],
    cta: "Go Creator",
    href: "/signup?plan=creator",
    popular: false,
    color: "border-red-500",
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="container px-4 py-24 lg:px-8 bg-secondary/30">
      <div className="mx-auto max-w-2xl text-center mb-16">
        <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl mb-4 text-balance">Simple, Transparent Pricing</h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Start free. Upgrade anytime. No hidden charges.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-4 max-w-7xl mx-auto">
        {plans.map((plan, index) => (
          <Card
            key={index}
            className={`relative ${plan.popular ? `${plan.color} shadow-lg shadow-blue-500/20` : plan.color}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
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
          Daily & monthly limits apply on all plans. Upgrade anytime to unlock more videos and features.
        </p>
      </div>
    </section>
  )
}