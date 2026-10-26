"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Crown,
  LoaderCircle,
  Sparkles,
  Zap,
  Shield,
  AlertCircle,
  Receipt,
  RefreshCw,
  ExternalLink,
} from "lucide-react"

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type Plan = {
  id: string
  name: string
  price: number
  priceLabel: string
  period: string
  badge?: string
  color: string
  accentBg: string
  borderColor: string
  icon: React.ReactNode
  features: string[]
  limit: string
}

type UserPlan = {
  plan: string
  freeVideosUsed: number
  paidVideoCredits: number
  totalSpent: number
}

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceLabel: "â‚¹0",
    period: "forever",
    color: "text-slate-300",
    accentBg: "bg-slate-400/[0.06]",
    borderColor: "border-white/[0.08]",
    icon: <Zap className="h-5 w-5 text-slate-400" />,
    limit: "2 free videos",
    features: [
      "2 AI-generated videos",
      "All content categories",
      "Hindi / English / Hinglish",
      "720p quality",
      "Basic thumbnail",
      "Script + voiceover",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: 499,
    priceLabel: "â‚¹499",
    period: "month",
    color: "text-violet-300",
    accentBg: "bg-violet-500/[0.07]",
    borderColor: "border-violet-400/25",
    icon: <Sparkles className="h-5 w-5 text-violet-300" />,
    limit: "20 videos/month",
    features: [
      "20 videos per month",
      "All content categories",
      "Hindi / English / Hinglish",
      "1080p quality",
      "AI thumbnails",
      "Script + voiceover",
      "YouTube auto-upload",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 999,
    priceLabel: "â‚¹999",
    period: "month",
    badge: "Most Popular",
    color: "text-fuchsia-300",
    accentBg: "bg-fuchsia-500/[0.08]",
    borderColor: "border-fuchsia-400/30",
    icon: <Crown className="h-5 w-5 text-fuchsia-300" />,
    limit: "60 videos/month",
    features: [
      "60 videos per month",
      "All content categories",
      "Hindi / English / Hinglish",
      "1080p + Shorts format",
      "AI thumbnails + captions",
      "Script + voiceover",
      "YouTube + Instagram upload",
      "Autopilot scheduling",
      "Priority support",
    ],
  },
  {
    id: "creator",
    name: "Creator",
    price: 1999,
    priceLabel: "â‚¹1,999",
    period: "month",
    color: "text-cyan-300",
    accentBg: "bg-cyan-500/[0.07]",
    borderColor: "border-cyan-400/25",
    icon: <Shield className="h-5 w-5 text-cyan-300" />,
    limit: "150 videos/month",
    features: [
      "150 videos per month",
      "All content categories",
      "Hindi / English / Hinglish",
      "4K + Shorts + Reels",
      "Advanced AI thumbnails",
      "Script + voice cloning",
      "YouTube + Instagram + Reels",
      "Full autopilot mode",
      "Admin approval panel",
      "Dedicated support",
    ],
  },
]

const cardCls =
  "rounded-2xl border border-white/[0.08] bg-[#10121b]/90 shadow-[0_18px_60px_rgba(0,0,0,0.18)]"

// â”€â”€â”€ Razorpay loader â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

declare global {
  interface Window {
    Razorpay: any
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const s = document.createElement("script")
    s.src = "https://checkout.razorpay.com/v1/checkout.js"
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function BillingPage() {
  const { data: session } = useSession()
  const [userPlan, setUserPlan]     = useState<UserPlan | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(true)
  const [paying, setPaying]         = useState<string | null>(null)
  const [success, setSuccess]       = useState("")
  const [error, setError]           = useState("")

  // Fetch current plan
  useEffect(() => {
    fetch("/api/db/users", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUserPlan({
          plan: d.user.plan || "free",
          freeVideosUsed: d.user.freeVideosUsed || 0,
          paidVideoCredits: d.user.paidVideoCredits || 0,
          totalSpent: d.user.totalSpent || 0,
        })
      })
      .catch(() => {})
      .finally(() => setLoadingPlan(false))
  }, [])

  async function handleUpgrade(plan: Plan) {
    if (plan.price === 0) return
    setError("")
    setSuccess("")
    setPaying(plan.id)

    try {
      const ok = await loadRazorpay()
      if (!ok) throw new Error("Payment gateway failed to load. Check your internet connection.")

      // Create order
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: plan.price, plan: plan.id }),
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error || "Order creation failed.")

      // Open Razorpay
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: "INR",
          name: "YouTubeAuto.ai",
          description: `${plan.name} Plan â€” ${plan.priceLabel}/month`,
          order_id: orderData.id,
          prefill: {
            name: session?.user?.name || "",
            email: session?.user?.email || "",
          },
          theme: { color: "#7c3aed" },
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch("/api/payments/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  plan: plan.id,
                }),
              })
              const vData = await verifyRes.json()
              if (!verifyRes.ok) throw new Error(vData.error || "Payment verification failed.")
              setSuccess(`ðŸŽ‰ Welcome to ${plan.name}! Your plan is now active.`)
              setUserPlan((u) => u ? { ...u, plan: plan.id } : u)
              resolve()
            } catch (e: any) {
              reject(e)
            }
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled.")) },
        })
        rzp.open()
      })
    } catch (e: any) {
      if (e.message !== "Payment cancelled.") setError(e.message)
    } finally {
      setPaying(null)
    }
  }

  const currentPlanId = userPlan?.plan || "free"
  const currentPlan   = PLANS.find((p) => p.id === currentPlanId) || PLANS[0]

  // Usage stats
  const usedCredits = currentPlanId === "free"
    ? userPlan?.freeVideosUsed || 0
    : (userPlan?.paidVideoCredits || 0)

  const totalCredits = currentPlanId === "free" ? 2
    : currentPlanId === "starter" ? 20
    : currentPlanId === "pro" ? 60
    : 150

  const usagePct = Math.min((usedCredits / totalCredits) * 100, 100)

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080910] text-white">

      {/* Blobs */}
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="absolute -top-44 left-[18%] h-[28rem] w-[28rem] rounded-full bg-violet-600/10 blur-[110px]" />
        <div className="absolute right-[-6rem] top-[30%] h-[22rem] w-[22rem] rounded-full bg-cyan-500/[0.06] blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[16rem] w-[16rem] rounded-full bg-fuchsia-600/[0.05] blur-[90px]" />
      </div>

      <div className="relative mx-auto max-w-[1300px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">

        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3.5 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white">
            <ArrowRight className="h-4 w-4 rotate-180" /> Dashboard
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.07] px-3 py-1.5 text-xs font-semibold text-violet-200">
            <CreditCard className="h-3.5 w-3.5" /> Billing &amp; Plans
          </div>
        </div>

        {/* Hero */}
        <div className="mt-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.07] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-violet-200">
            <Sparkles className="h-3.5 w-3.5" /> Subscription
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Grow without limits.
            <span className="mt-1 block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-200 bg-clip-text text-transparent">
              Pick your plan.
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
            All plans include AI script, voiceover, thumbnail generation and YouTube auto-upload. Cancel anytime.
          </p>
        </div>

        {/* Current plan + usage */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {/* Plan card */}
          <div className={`${cardCls} p-5`}>
            {loadingPlan ? (
              <div className="space-y-3">
                <div className="h-5 w-24 animate-pulse rounded bg-white/5" />
                <div className="h-8 w-32 animate-pulse rounded bg-white/5" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Current plan</p>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${currentPlan.borderColor} ${currentPlan.accentBg} ${currentPlan.color}`}>
                    {currentPlan.name}
                  </span>
                </div>
                <p className="mt-3 text-3xl font-bold">{currentPlan.priceLabel}
                  {currentPlan.price > 0 && <span className="text-sm font-normal text-slate-400">/mo</span>}
                </p>
                <p className="mt-1 text-xs text-slate-500">{currentPlan.limit}</p>
              </>
            )}
          </div>

          {/* Usage card */}
          <div className={`${cardCls} p-5`}>
            <p className="text-xs text-slate-400 uppercase tracking-widest">Video credits</p>
            <p className="mt-3 text-3xl font-bold">{usedCredits}
              <span className="text-sm font-normal text-slate-400"> / {totalCredits}</span>
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-700 ${usagePct >= 90 ? "bg-rose-400" : usagePct >= 60 ? "bg-amber-400" : "bg-gradient-to-r from-violet-400 to-cyan-300"}`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">{Math.round(usagePct)}% used this cycle</p>
          </div>

          {/* Spend card */}
          <div className={`${cardCls} p-5`}>
            <p className="text-xs text-slate-400 uppercase tracking-widest">Total spent</p>
            <p className="mt-3 text-3xl font-bold">â‚¹{(userPlan?.totalSpent || 0).toLocaleString("en-IN")}</p>
            <p className="mt-1 text-xs text-slate-500">Lifetime on YouTubeAuto.ai</p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> Payments via Razorpay Â· Secure
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] p-3 text-sm text-rose-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] p-3 text-sm text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {success}
          </div>
        )}

        {/* Plan cards */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlanId
            const isDowngrade = PLANS.findIndex(p => p.id === plan.id) < PLANS.findIndex(p => p.id === currentPlanId)
            const isLoading = paying === plan.id

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-5 transition ${
                  isCurrent
                    ? `${plan.borderColor} ${plan.accentBg}`
                    : plan.badge
                    ? "border-fuchsia-400/30 bg-[#10121b]/90"
                    : "border-white/[0.08] bg-[#10121b]/90"
                } shadow-[0_18px_60px_rgba(0,0,0,0.18)]`}
              >
                {/* Popular badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-fuchsia-400/30 bg-fuchsia-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-fuchsia-200">
                    {plan.badge}
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${plan.borderColor} ${plan.accentBg}`}>
                    {plan.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{plan.name}</p>
                    <p className="text-[10px] text-slate-500">{plan.limit}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mt-4">
                  <span className={`text-3xl font-bold ${plan.color}`}>{plan.priceLabel}</span>
                  {plan.price > 0 && <span className="text-xs text-slate-400"> / {plan.period}</span>}
                </div>

                {/* Features */}
                <ul className="mt-4 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                      <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${plan.color}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  type="button"
                  disabled={isCurrent || isDowngrade || isLoading || paying !== null}
                  onClick={() => handleUpgrade(plan)}
                  className={`mt-5 w-full rounded-xl py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isCurrent
                      ? `border ${plan.borderColor} ${plan.color} bg-transparent`
                      : isDowngrade
                      ? "border border-white/10 text-slate-500 bg-transparent"
                      : plan.id === "pro"
                      ? "bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white shadow-lg shadow-fuchsia-900/20 hover:brightness-110"
                      : `border ${plan.borderColor} ${plan.color} ${plan.accentBg} hover:brightness-110`
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoaderCircle className="h-4 w-4 animate-spin" /> Processingâ€¦
                    </span>
                  ) : isCurrent ? "Current plan" : isDowngrade ? "Downgrade" : plan.price === 0 ? "Free" : `Upgrade to ${plan.name}`}
                </button>
              </div>
            )
          })}
        </div>

        {/* Info strip */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Shield,    label: "Secure payments",   desc: "256-bit SSL via Razorpay" },
            { icon: RefreshCw, label: "Cancel anytime",    desc: "No lock-in, no hidden fees" },
            { icon: Receipt,   label: "GST invoice",       desc: "Auto-generated after payment" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className={`${cardCls} flex items-center gap-3 p-4`}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                <Icon className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">{label}</p>
                <p className="text-[10px] text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className={`${cardCls} mt-6 p-5 sm:p-6`}>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400">FAQ</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              { q: "When do credits reset?", a: "Video credits reset on the 1st of every month." },
              { q: "Can I upgrade mid-month?", a: "Yes â€” you're charged immediately and credits top up instantly." },
              { q: "What payment methods are accepted?", a: "UPI, credit/debit cards, net banking via Razorpay." },
              { q: "Is there a refund policy?", a: "Contact support within 24 hrs of payment for refund requests." },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="text-xs font-semibold text-slate-200">{q}</p>
                <p className="mt-1.5 text-xs leading-5 text-slate-400">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-7 flex flex-col items-center justify-between gap-2 border-t border-white/[0.07] pt-5 text-center text-xs text-slate-600 sm:flex-row sm:text-left">
          <span>YouTubeAuto.ai Â· Billing powered by Razorpay</span>
          <a href="mailto:singhaditya4560@gmail.com" className="flex items-center gap-1 hover:text-slate-400 transition">
            Need help? Contact support <ExternalLink className="h-3 w-3" />
          </a>
        </footer>
      </div>
    </main>
  )
}

