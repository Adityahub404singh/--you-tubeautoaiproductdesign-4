import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { Card, CardContent } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <Header />

      <section className="container px-4 py-24 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: January 2025</p>
          </div>

          <Card>
            <CardContent className="p-8 space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4">Data Collection</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We collect information you provide directly to us, including your name, email address, and YouTube
                  channel information when you sign up for our service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">YouTube Data Usage</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  YouTubeAuto.ai uses the YouTube API to connect your channel and automate video uploads. We access:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Your YouTube channel information (name, subscriber count, etc.)</li>
                  <li>Upload permissions to publish videos on your behalf</li>
                  <li>Video analytics and performance metrics</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  We do NOT access your personal Google data beyond what's necessary for YouTube automation.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We implement industry-standard security measures to protect your data. Your YouTube credentials are
                  encrypted and stored securely using OAuth 2.0 authentication.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Payment Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Payment processing is handled securely through Stripe. We never store your credit card information on
                  our servers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Data Sharing</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We do not sell or share your personal information with third parties except as necessary to provide
                  our services (e.g., YouTube API for video uploads, Stripe for payments).
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Access your personal data</li>
                  <li>Request deletion of your account and data</li>
                  <li>Revoke YouTube access permissions at any time</li>
                  <li>Export your data</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For any privacy-related questions or to exercise your rights, please contact us at
                  support@youtubeauto.ai
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </main>
  )
}
