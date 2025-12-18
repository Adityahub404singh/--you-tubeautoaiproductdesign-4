import { Calendar, Zap, Globe, Video, Mic, BarChart3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Calendar,
    title: "30-Day Content Calendar",
    description: "One prompt generates an entire month of content. Set it and forget it.",
  },
  {
    icon: Zap,
    title: "Fully Automated",
    description: "AI generates scripts, creates videos, and publishes to YouTube automatically.",
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    description: "Create content in 50+ languages with native voiceovers.",
  },
  {
    icon: Video,
    title: "Professional Videos",
    description: "HD videos with stock footage, subtitles, and custom branding.",
  },
  {
    icon: Mic,
    title: "AI Voice Cloning",
    description: "Clone your voice or choose from 50+ professional AI voices.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track performance across all your channels in one place.",
  },
]

export function Features() {
  return (
    <section id="features" className="container px-4 py-24 lg:px-8">
      <div className="mx-auto max-w-2xl text-center mb-16">
        <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl mb-4 text-balance">
          Everything You Need to Automate YouTube
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          From script generation to video publishing, we handle it all.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {features.map((feature, index) => (
          <Card key={index} className="bg-card border-border">
            <CardContent className="p-6">
              <feature.icon className="h-10 w-10 mb-4 text-accent" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
