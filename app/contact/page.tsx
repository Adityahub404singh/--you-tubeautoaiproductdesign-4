import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Clock, MessageCircle } from "lucide-react"
import { CONTACT } from "@/lib/constants"

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      <Header />

      <section className="container px-4 py-24 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4 text-balance">Get in Touch</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Have questions? Need support? We're here to help you automate your YouTube success.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 mb-12">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Reach out to us directly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-accent transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">Email Us</p>
                      <p className="text-sm text-muted-foreground">{CONTACT.email}</p>
                    </div>
                  </a>

                  <a
                    href={CONTACT.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-green-500 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">WhatsApp Support</p>
                      <p className="text-sm text-muted-foreground">Click to message us</p>
                    </div>
                  </a>

                  <div className="flex items-center gap-3 p-4 rounded-lg border border-border">
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">Response Time</p>
                      <p className="text-sm text-muted-foreground">Within 24 hours</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Send Us a Message</CardTitle>
                <CardDescription>We'll get back to you within 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="your@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" placeholder="How can we help?" rows={5} />
                  </div>
                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-4 text-center">Why Choose YouTubeAuto.ai?</h3>
              <div className="grid gap-6 md:grid-cols-3 text-center">
                <div>
                  <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-accent/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-accent" />
                  </div>
                  <h4 className="font-medium mb-2">Quick Support</h4>
                  <p className="text-sm text-muted-foreground">Get answers to all your questions within 24 hours</p>
                </div>
                <div>
                  <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-accent/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-accent" />
                  </div>
                  <h4 className="font-medium mb-2">Easy Setup</h4>
                  <p className="text-sm text-muted-foreground">Get started in minutes with our simple onboarding</p>
                </div>
                <div>
                  <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-accent/10 flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-accent" />
                  </div>
                  <h4 className="font-medium mb-2">Direct Support</h4>
                  <p className="text-sm text-muted-foreground">Chat with us directly on WhatsApp for instant help</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </main>
  )
}
