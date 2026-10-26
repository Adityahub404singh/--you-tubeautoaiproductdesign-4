"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Settings = {
  category: string;
  subCategory: string;
  cronSchedule: string;
  isAutoApprove: boolean;
  language: string;
  isActive: boolean;
};

const initial: Settings = {
  category: "cinematic",
  subCategory: "sigma",
  cronSchedule: "0 18 * * *",
  isAutoApprove: false,
  language: "hi",
  isActive: false,
};

const categories = [
  ["cinematic", "Cinematic"], ["facts", "Facts & knowledge"],
  ["motivation", "Motivation"], ["tech", "Technology"],
  ["history", "History"], ["horror", "Horror"],
  ["psychology", "Psychology"], ["story", "Storytelling"], ["general", "General"],
];

export default function AutopilotPage() {
  const [settings, setSettings] = useState<Settings>(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  useEffect(() => {
    let live = true;
    fetch("/api/autopilot/settings", { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Could not load settings.");
        if (live && data.settings) setSettings({ ...initial, ...data.settings });
      })
      .catch((e) => {
        if (live) { setMessage(e instanceof Error ? e.message : "Could not load settings."); setMessageType("error"); }
      })
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/autopilot/settings", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Settings could not be saved.");
      setSettings({ ...initial, ...data.settings });
      setMessage("Settings saved. Remember: saving does not start the scheduler by itself.");
      setMessageType("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Settings could not be saved.");
      setMessageType("error");
    } finally { setSaving(false); }
  }

  const field = "mt-2 w-full rounded-xl border border-white/10 bg-[#0a0b10] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/70 focus:ring-2 focus:ring-violet-500/15";

  return (
    <main className="min-h-screen overflow-hidden bg-[#07080d] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.07] hover:text-white">← <span>Dashboard</span></Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-3 py-1.5 text-xs font-medium text-amber-200"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Manual approval mode</span>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.07] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200"><span>✦</span> Creator automation studio</div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Your channel.<br /><span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-200 bg-clip-text text-transparent">On autopilot.</span></h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">Plan your niche, choose a language and set a publishing rhythm. Review the workflow before anything goes public.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between"><span className="text-sm text-slate-400">Automation status</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${settings.isActive ? "bg-emerald-400/10 text-emerald-300" : "bg-slate-400/10 text-slate-300"}`}>{settings.isActive ? "Enabled" : "Paused"}</span></div>
            <div className="mt-4 text-2xl font-semibold">{settings.isActive ? "Ready to configure" : "You're in control"}</div>
            <p className="mt-2 text-sm leading-5 text-slate-400">{settings.isActive ? "Confirm your schedule and keep approval on while testing." : "Turn it on when your settings are ready. Publishing approval stays separate."}</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full transition-all ${settings.isActive ? "w-2/3 bg-gradient-to-r from-violet-400 to-cyan-300" : "w-1/4 bg-slate-500"}`} /></div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="rounded-3xl border border-white/10 bg-[#0d0e15]/90 p-5 shadow-2xl shadow-black/20 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.08] pb-5">
              <div><h2 className="text-lg font-semibold">Content settings</h2><p className="mt-1 text-sm text-slate-400">Shape what the autopilot creates.</p></div>
              <span className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-400">01 / CONFIGURE</span>
            </div>
            {loading ? <div className="space-y-4 py-8"><div className="h-11 animate-pulse rounded-xl bg-white/5"/><div className="h-11 animate-pulse rounded-xl bg-white/5"/><div className="h-11 animate-pulse rounded-xl bg-white/5"/></div> : (
              <div className="grid gap-5 pt-5 sm:grid-cols-2">
                <div><label htmlFor="category" className="text-sm font-medium text-slate-200">Content category</label><select id="category" className={field} value={settings.category} onChange={(e) => update("category", e.target.value)}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                <div><label htmlFor="subCategory" className="text-sm font-medium text-slate-200">Niche / channel angle</label><input id="subCategory" className={field} value={settings.subCategory} maxLength={80} placeholder="e.g. sigma mindset, space facts" onChange={(e) => update("subCategory", e.target.value)} /></div>
                <div><label htmlFor="language" className="text-sm font-medium text-slate-200">Video language</label><select id="language" className={field} value={settings.language} onChange={(e) => update("language", e.target.value)}><option value="hi">Hindi</option><option value="en">English</option><option value="hinglish">Hinglish</option></select></div>
                <div><label htmlFor="cronSchedule" className="text-sm font-medium text-slate-200">Publishing schedule</label><input id="cronSchedule" className={`${field} font-mono`} value={settings.cronSchedule} onChange={(e) => update("cronSchedule", e.target.value)} aria-describedby="schedule-help"/><p id="schedule-help" className="mt-2 text-xs leading-5 text-slate-500"><code className="text-cyan-200">0 18 * * *</code> = daily at 6 PM in configured timezone.</p></div>
              </div>
            )}
            <div className="mt-6 space-y-3 border-t border-white/[0.08] pt-5">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 transition hover:bg-white/[0.045]"><input type="checkbox" className="mt-1 h-4 w-4 accent-violet-400" checked={settings.isActive} onChange={(e) => update("isActive", e.target.checked)} /><span><span className="block text-sm font-medium">Enable autopilot</span><span className="mt-1 block text-xs leading-5 text-slate-400">Allow this account to be considered by the configured scheduler.</span></span></label>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[0.035] p-4 transition hover:bg-amber-300/[0.06]"><input type="checkbox" className="mt-1 h-4 w-4 accent-amber-300" checked={settings.isAutoApprove} onChange={(e) => update("isAutoApprove", e.target.checked)} /><span><span className="block text-sm font-medium">Publish automatically without review</span><span className="mt-1 block text-xs leading-5 text-slate-400">When enabled and fully configured, videos may go public without manual approval. Keep off while testing.</span></span></label>
            </div>
            <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => { window.location.href = "/api/auth/youtube?action=connect"; }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-semibold transition hover:border-red-300/40 hover:bg-white/[0.08]"><span className="text-base">▶</span> Connect YouTube</button>
              <button type="button" disabled={saving || loading} onClick={save} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold shadow-lg shadow-violet-900/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving settings…" : "Save settings →"}</button>
            </div>
            {message && <div role="status" className={`mt-4 rounded-xl border p-3 text-sm ${messageType === "error" ? "border-rose-400/20 bg-rose-400/[0.07] text-rose-200" : messageType === "success" ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-200" : "border-white/10 bg-white/[0.04] text-slate-300"}`}>{message}</div>}
          </div>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-[#0d0e15]/90 p-5">
              <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-lg">✦</div><div><h3 className="font-semibold">Workflow preview</h3><p className="text-xs text-slate-500">Expected pipeline</p></div></div>
              <ol className="mt-5 space-y-4">
                {["Topic & script", "Voice-over", "Render video", "Thumbnail & review", "YouTube upload"].map((step, i) => <li key={step} className="flex items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-violet-300/20 bg-violet-300/[0.07] text-xs font-semibold text-violet-200">{String(i + 1).padStart(2, "0")}</span><span className="text-sm text-slate-300">{step}</span><span className="ml-auto text-xs text-slate-600">{i === 4 ? "Last" : "Next"}</span></li>)}
              </ol>
              <p className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-xs leading-5 text-slate-400">This is a workflow preview, not a live health check. Each stage must be tested before automation is trusted.</p>
            </div>
            <div className="rounded-3xl border border-emerald-300/15 bg-emerald-300/[0.035] p-5"><div className="flex items-center gap-2 text-sm font-semibold text-emerald-200"><span>✓</span> Safe testing checklist</div><ul className="mt-3 space-y-2 text-sm leading-5 text-slate-300"><li>• Keep auto-publish off</li><li>• Connect the correct channel</li><li>• Save settings and verify persistence</li><li>• Run one test before scheduling</li></ul></div>
          </aside>
        </section>
        <p className="mt-7 text-center text-xs leading-5 text-slate-600">Local development mode · Saving settings does not start a scheduler automatically.</p>
      </div>
    </main>
  );
}
