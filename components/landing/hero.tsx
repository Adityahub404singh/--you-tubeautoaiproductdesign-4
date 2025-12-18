import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

export function Hero() {
  return (
    <section className="container px-4 py-24 md:py-32 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-sm">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-accent-foreground">AI-Powered Content Automation</span>
        </div>

        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl text-balance">
          Automate Your YouTube Channel with AI
        </h1>

        <p className="mb-10 text-lg text-muted-foreground md:text-xl leading-relaxed text-balance">
          Set it once, forget it forever. Generate and publish professional YouTube videos automatically with AI-powered
          scripts, voiceovers, and scheduling. Start with 10 FREE videos.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Button size="lg" asChild className="w-full sm:w-auto">
            <Link href="/signup">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="w-full sm:w-auto bg-transparent">
            <Link href="#how-it-works">Learn More</Link>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          10 videos free • No credit card required • Connect your YouTube channel
        </p>
      </div>
    </section>
  )
}
