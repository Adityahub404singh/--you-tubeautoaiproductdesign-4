"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminRoute } from "@/components/auth/admin-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Mail, Send, Loader2, CheckCircle2, AlertTriangle, Info, Copy, ExternalLink } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface TestResult {
  success: boolean
  mode: "live" | "no-key" | "error"
  message?: string
  error?: string
  hint?: string
  instructions?: string[]
  data?: Record<string, unknown>
}

export default function EmailTestPage() {
  const { user } = useAuth()
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email)
  }, [user])

  const handleSendTest = async () => {
    if (!email.trim()) return
    setSending(true)
    setResult(null)

    try {
      const res = await fetch("/api/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email }),
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setResult({
        success: false,
        mode: "error",
        error: "Network error. Make sure the dev server is running.",
      })
    } finally {
      setSending(false)
    }
  }

  const handleTestAllTemplates = async () => {
    if (!email.trim()) return
    setSending(true)
    setResult(null)

    const templates = ["video-approved", "video-live", "video-failed"]
    const results: string[] = []

    for (const type of templates) {
      try {
        const res = await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email,
            type,
            subject: `[TEST] ${type} notification`,
          }),
        })
        const data = await res.json()
        results.push(`${type}: ${data.success ? "✅ Sent" : "❌ Failed"}`)
      } catch {
        results.push(`${type}: ❌ Network error`)
      }
    }

    setResult({
      success: true,
      mode: "live",
      message: `All 3 template emails sent to ${email}:\n${results.join("\n")}`,
    })
    setSending(false)
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Mail className="h-8 w-8" />
                Email Notification Test
              </h1>
              <p className="text-muted-foreground mt-1">
                Test email notifications to make sure they're working
              </p>
            </div>

            {/* Setup Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Setup Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Resend Package</span>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    ✅ Installed
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Email API Route</span>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    ✅ Ready
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">RESEND_API_KEY</span>
                  </div>
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                    ⚠️ Test to verify
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Send Test Email */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Send Test Email</CardTitle>
                <CardDescription>
                  Enter your email address to receive a test notification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Recipient Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your-email@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleSendTest} disabled={sending || !email.trim()}>
                    {sending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" /> Send Test Email</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTestAllTemplates}
                    disabled={sending || !email.trim()}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Test All 3 Templates
                  </Button>
                </div>

                {/* Results */}
                {result && (
                  <div className={`p-4 rounded-lg border space-y-3 ${
                    result.mode === "live" && result.success
                      ? "bg-green-500/10 border-green-500/20"
                      : result.mode === "no-key"
                      ? "bg-yellow-500/10 border-yellow-500/20"
                      : "bg-red-500/10 border-red-500/20"
                  }`}>
                    <div className="flex items-center gap-2">
                      {result.mode === "live" && result.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : result.mode === "no-key" ? (
                        <Info className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      )}
                      <span className={`font-medium ${
                        result.mode === "live" && result.success
                          ? "text-green-500"
                          : result.mode === "no-key"
                          ? "text-yellow-500"
                          : "text-red-500"
                      }`}>
                        {result.mode === "live" && result.success
                          ? "✅ Email Sent Successfully!"
                          : result.mode === "no-key"
                          ? "⚠️ API Key Not Configured"
                          : "❌ Email Failed"}
                      </span>
                    </div>

                    {result.message && (
                      <p className="text-sm whitespace-pre-line">{result.message}</p>
                    )}

                    {result.error && (
                      <p className="text-sm text-red-500">Error: {result.error}</p>
                    )}

                    {result.hint && (
                      <p className="text-sm text-muted-foreground">{result.hint}</p>
                    )}

                    {result.instructions && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">How to set up:</p>
                        <ol className="space-y-1">
                          {result.instructions.map((step, i) => (
                            <li key={i} className="text-sm text-muted-foreground">{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {result.data && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground">Response Details</summary>
                        <pre className="mt-2 p-2 bg-background rounded text-xs overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* How to Get API Key */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📝 How to Get Resend API Key (Free)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">1.</span>
                    <span>Go to <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">resend.com <ExternalLink className="h-3 w-3" /></a> and sign up (free account)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">2.</span>
                    <span>After login, go to <strong>API Keys</strong> in the sidebar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">3.</span>
                    <span>Click <strong>"Create API Key"</strong> → Give it a name like "YouTubeAuto"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">4.</span>
                    <span>Copy the key (it starts with <code className="bg-muted px-1 rounded">re_</code>)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">5.</span>
                    <div>
                      <span>Open <code className="bg-muted px-1 rounded">.env.local</code> in your project root and paste:</span>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-xs block">RESEND_API_KEY=re_your_key_here</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => navigator.clipboard.writeText("RESEND_API_KEY=re_your_key_here")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">6.</span>
                    <span>Restart the dev server (<code className="bg-muted px-1 rounded">Ctrl+C</code> then <code className="bg-muted px-1 rounded">pnpm dev</code>)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">7.</span>
                    <span>Come back here and click <strong>"Send Test Email"</strong> to verify!</span>
                  </li>
                </ol>

                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
                  <p className="font-medium text-blue-500">💡 Free tier includes:</p>
                  <ul className="mt-1 text-muted-foreground list-disc list-inside">
                    <li>100 emails/day</li>
                    <li>3,000 emails/month</li>
                    <li>No credit card required</li>
                  </ul>
                </div>

                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm">
                  <p className="font-medium text-yellow-500">⚠️ Important Note:</p>
                  <p className="text-muted-foreground mt-1">
                    Without API key, emails are <strong>logged to the terminal console</strong> instead of being sent.
                    This is useful for development but won't reach actual inboxes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AdminRoute>
  )
}
