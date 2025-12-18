import { Card, CardContent } from "@/components/ui/card"

const steps = [
  {
    number: "01",
    title: "Connect Your Channel",
    description: "Link your YouTube channel and set your content preferences in minutes.",
  },
  {
    number: "02",
    title: "Describe Your Content",
    description: "Tell us your niche, tone, and goals. Our AI creates a 30-day content plan.",
  },
  {
    number: "03",
    title: "AI Creates Videos",
    description: "Every day, AI generates scripts, creates videos, and schedules uploads automatically.",
  },
  {
    number: "04",
    title: "Track & Optimize",
    description: "Monitor performance and let AI optimize your content strategy over time.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="container px-4 py-24 lg:px-8">
      <div className="mx-auto max-w-2xl text-center mb-16">
        <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl mb-4 text-balance">How It Works</h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Get started in 4 simple steps and let AI handle the rest.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
        {steps.map((step, index) => (
          <Card key={index} className="bg-card border-border relative">
            <CardContent className="p-6">
              <div className="text-6xl font-bold text-accent/20 mb-4">{step.number}</div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
