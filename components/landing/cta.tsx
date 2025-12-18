import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function CTA() {
  return (
    <section className="container px-4 py-24 lg:px-8">
      <div className="mx-auto max-w-4xl text-center bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-2xl p-12 md:p-16">
        <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl mb-6 text-balance">
          Ready to Automate Your YouTube Channel?
        </h2>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Join thousands of creators who have automated their content creation. Start your free trial today.
        </p>
        <Button size="lg" asChild>
          <Link href="/signup">
            Start Free Trial
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <p className="mt-6 text-sm text-muted-foreground">No credit card required • 30 videos free • Cancel anytime</p>
      </div>
    </section>
  )
}
