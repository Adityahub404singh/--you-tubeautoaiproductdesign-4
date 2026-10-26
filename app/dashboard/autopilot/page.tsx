"use client";

import { useEffect, useRef, useState, type DragEvent, type SyntheticEvent } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  FileVideo,
  Film,
  Gauge,
  HardDrive,
  Languages,
  LoaderCircle,
  Save,
  ShieldCheck,
  Sparkles,
  Upload,
  Youtube,
  Zap,
  Globe,
  Instagram,
  RefreshCw,
  XCircle,
  BarChart3,
  Settings2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Settings = {
  category: string;
  subCategory: string;
  cronSchedule: string;
  isAutoApprove: boolean;
  language: string;
  isActive: boolean;
};

type VideoReport = {
  name: string;
  size: number;
  type: string;
  duration: number;
  width: number;
  height: number;
  ratio: number;
};

type ConnectionStatus = {
  youtube: "loading" | "connected" | "disconnected";
  instagram: "loading" | "connected" | "disconnected";
};

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL: Settings = {
  category: "psychology",
  subCategory: "dark_psychology",
  cronSchedule: "0 18 * * *",
  isAutoApprove: false,
  language: "hi",
  isActive: false,
};

const CATEGORIES = [
  { value: "psychology",      label: "🧠 Psychology" },
  { value: "motivation",      label: "🔥 Motivation" },
  { value: "history",         label: "📜 History" },
  { value: "horror",          label: "👻 Horror" },
  { value: "storytelling",    label: "📖 Storytelling" },
  { value: "businesslessons", label: "💼 Business Lessons" },
  { value: "startupstories",  label: "🚀 Startup Stories" },
  { value: "luxury",          label: "💎 Luxury" },
  { value: "quotes",          label: "💬 Quotes" },
  { value: "stoicism",        label: "⚖️ Stoicism" },
  { value: "pov",             label: "🎭 POV Stories" },
  { value: "ainews",          label: "🤖 AI News" },
  { value: "general",         label: "🌟 General" },
];

const CRON_PRESETS = [
  { label: "Daily 6 PM",     value: "0 18 * * *" },
  { label: "Daily 9 AM",     value: "0 9 * * *" },
  { label: "Twice daily",    value: "0 9,18 * * *" },
  { label: "Every 2 days",   value: "0 18 */2 * *" },
  { label: "Weekdays only",  value: "0 18 * * 1-5" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

function parseCron(cron: string) {
  try {
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) return null;
    const [min, hour] = parts;
    if (min === "0" && /^\d+$/.test(hour)) {
      const h = parseInt(hour);
      return `Daily at ${h === 0 ? "12:00 AM" : h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`}`;
    }
    return "Custom schedule";
  } catch {
    return null;
  }
}

// ─── Style constants ──────────────────────────────────────────────────────────

const inputCls =
  "mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b0d14] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/15";

const cardCls =
  "rounded-2xl border border-white/[0.08] bg-[#10121b]/90 shadow-[0_18px_60px_rgba(0,0,0,0.18)]";

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [settings, setSettings]       = useState<Settings>(INITIAL);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState("");
  const [connections, setConnections] = useState<ConnectionStatus>({ youtube: "loading", instagram: "loading" });

  const [videoFile, setVideoFile]     = useState<File | null>(null);
  const [videoUrl, setVideoUrl]       = useState("");
  const [videoReport, setVideoReport] = useState<VideoReport | null>(null);
  const [videoError, setVideoError]   = useState("");
  const [videoBusy, setVideoBusy]     = useState(false);
  const [dragging, setDragging]       = useState(false);
  const fileRef                       = useRef<HTMLInputElement>(null);

  // Load settings
  useEffect(() => {
    let alive = true;
    fetch("/api/autopilot/settings", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed to load.");
        if (alive && d.settings) setSettings({ ...INITIAL, ...d.settings });
      })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  // Check connection status
  useEffect(() => {
    fetch("/api/youtube/status")
      .then((r) => r.json())
      .then((d) => setConnections((c) => ({ ...c, youtube: d.connected ? "connected" : "disconnected" })))
      .catch(() => setConnections((c) => ({ ...c, youtube: "disconnected" })));

    fetch("/api/instagram/status")
      .then((r) => r.json())
      .then((d) => setConnections((c) => ({ ...c, instagram: d.connected ? "connected" : "disconnected" })))
      .catch(() => setConnections((c) => ({ ...c, instagram: "disconnected" })));
  }, []);

  // Revoke blob URL
  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl); }, [videoUrl]);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const r = await fetch("/api/autopilot/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Save failed.");
      setSettings({ ...INITIAL, ...d.settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Video helpers ──
  function clearVideo() {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(null); setVideoUrl(""); setVideoReport(null);
    setVideoError(""); setVideoBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function acceptFile(file?: File) {
    setVideoError(""); setVideoReport(null);
    if (!file) return;
    if (!file.type.startsWith("video/") && !/\.(mp4|mov|webm|m4v|ogv)$/i.test(file.name)) {
      setVideoError("Choose an MP4, MOV, WebM or M4V file."); return;
    }
    if (file.size === 0) { setVideoError("File is empty."); return; }
    if (file.size > 500 * 1024 * 1024) { setVideoError("Max 500 MB supported."); return; }
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setVideoBusy(true);
  }

  function onMetadata(e: SyntheticEvent<HTMLVideoElement>) {
    const el = e.currentTarget;
    if (!videoFile) return;
    const { videoWidth: w, videoHeight: h, duration } = el;
    if (!w || !h || !Number.isFinite(duration)) {
      setVideoError("Cannot read metadata — try another MP4/WebM.");
      setVideoBusy(false); return;
    }
    setVideoReport({ name: videoFile.name, size: videoFile.size, type: videoFile.type || "unknown", duration, width: w, height: h, ratio: w / h });
    setVideoBusy(false);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault(); setDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  }

  const checks = videoReport ? [
    { label: "Metadata readable",  ok: true,                                              detail: "Duration and dimensions confirmed." },
    { label: "HD resolution",      ok: videoReport.width >= 1280 && videoReport.height >= 720,  detail: videoReport.width >= 1280 ? "1280×720 or above — good." : "Below 720p — export at HD." },
    { label: "Portrait / square",  ok: videoReport.height >= videoReport.width,           detail: videoReport.height >= videoReport.width ? "9:16 — Shorts-ready." : "16:9 landscape format." },
    { label: "File size ≤ 100 MB", ok: videoReport.size <= 100 * 1024 * 1024,            detail: videoReport.size <= 100 * 1024 * 1024 ? "Within upload limit." : "Large file — check server limits." },
  ] : [];

  const cronLabel = parseCron(settings.cronSchedule);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080910] text-white">

      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="absolute -top-44 left-[18%] h-[28rem] w-[28rem] rounded-full bg-violet-600/10 blur-[110px]" />
        <div className="absolute right-[-6rem] top-[30%] h-[22rem] w-[22rem] rounded-full bg-cyan-500/[0.07] blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 h-[18rem] w-[18rem] -translate-x-1/2 rounded-full bg-fuchsia-600/[0.05] blur-[90px]" />
      </div>

      <div className="relative mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">

        {/* ── Top bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3.5 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white">
            <ArrowRight className="h-4 w-4 rotate-180" /> Dashboard
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-1.5 text-xs font-medium text-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" /> Manual review active
          </div>
        </div>

        {/* ── Hero ── */}
        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.07] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-violet-200">
              <Sparkles className="h-3.5 w-3.5" /> Creator Automation Studio
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.5rem]">
              Automate smarter.
              <span className="mt-1 block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-200 bg-clip-text text-transparent">
                Stay in control.
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Configure your content niche, schedule, and platform connections — then let YouTubeAuto.ai handle the rest.
            </p>
          </div>

          {/* Status card */}
          <div className={`${cardCls} p-5`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400 uppercase tracking-widest">Autopilot</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${settings.isActive ? "bg-emerald-300/10 text-emerald-200" : "bg-slate-400/10 text-slate-400"}`}>
                {settings.isActive ? "● Active" : "○ Paused"}
              </span>
            </div>
            <p className="mt-3 text-xl font-semibold">{settings.isActive ? "Configured & ready" : "You're in control"}</p>
            <p className="mt-1.5 text-xs leading-5 text-slate-400">{settings.isActive ? "Disable auto-publish until workflow is fully tested." : "Set your preferences and save. No scheduler starts automatically."}</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className={`h-full rounded-full transition-all duration-500 ${settings.isActive ? "w-2/3 bg-gradient-to-r from-violet-400 to-cyan-300" : "w-1/4 bg-slate-600"}`} />
            </div>
            {cronLabel && (
              <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
                <Clock3 className="h-3 w-3" /> {cronLabel}
              </p>
            )}
          </div>
        </section>

        {/* ── Main grid ── */}
        <section className="mt-8 grid gap-5 xl:grid-cols-[1fr_400px]">

          {/* ── LEFT: Settings form ── */}
          <div className={`${cardCls} min-w-0 p-5 sm:p-7`}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.08] pb-5">
              <div>
                <div className="flex items-center gap-2 text-violet-200">
                  <Settings2 className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.14em]">Workspace setup</span>
                </div>
                <h2 className="mt-2 text-xl font-semibold">Content settings</h2>
                <p className="mt-1 text-sm text-slate-400">Define your niche, language and publishing rhythm.</p>
              </div>
              <span className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-500">01 / CONFIGURE</span>
            </div>

            {loading ? (
              <div className="space-y-4 py-8">
                {[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded-xl bg-white/5" />)}
              </div>
            ) : (
              <div className="grid gap-5 pt-5 sm:grid-cols-2">

                {/* Category */}
                <div>
                  <label className="text-sm font-medium text-slate-200">Content category</label>
                  <select className={inputCls} value={settings.category} onChange={(e) => update("category", e.target.value)}>
                    {CATEGORIES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>

                {/* Sub-niche */}
                <div>
                  <label className="text-sm font-medium text-slate-200">Sub-niche / angle</label>
                  <input className={inputCls} value={settings.subCategory} maxLength={80}
                    placeholder="e.g. dark_psychology, sigma mindset"
                    onChange={(e) => update("subCategory", e.target.value)} />
                </div>

                {/* Language */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
                    <Languages className="h-4 w-4 text-slate-400" /> Video language
                  </label>
                  <select className={inputCls} value={settings.language} onChange={(e) => update("language", e.target.value)}>
                    <option value="hi">🇮🇳 Hindi</option>
                    <option value="en">🇬🇧 English</option>
                    <option value="hinglish">🔀 Hinglish</option>
                  </select>
                </div>

                {/* Schedule */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
                    <Clock3 className="h-4 w-4 text-slate-400" /> Cron schedule
                  </label>
                  <input className={`${inputCls} font-mono`} value={settings.cronSchedule}
                    onChange={(e) => update("cronSchedule", e.target.value)} />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {CRON_PRESETS.map((p) => (
                      <button key={p.value} type="button"
                        onClick={() => update("cronSchedule", p.value)}
                        className={`rounded-lg border px-2.5 py-1 text-xs transition ${settings.cronSchedule === p.value ? "border-violet-400/40 bg-violet-400/10 text-violet-200" : "border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300"}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Toggles */}
            <div className="mt-6 space-y-3 border-t border-white/[0.08] pt-5">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 transition hover:border-violet-300/20 hover:bg-white/[0.04]">
                <div className="relative mt-0.5">
                  <input type="checkbox" className="sr-only peer" checked={settings.isActive} onChange={(e) => update("isActive", e.target.checked)} />
                  <div className="h-5 w-9 rounded-full bg-white/10 peer-checked:bg-violet-500 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <span>
                  <span className="block text-sm font-medium">Enable autopilot</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">Marks this workspace as active. A cron job must be configured separately on your server.</span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[0.03] p-4 transition hover:bg-amber-300/[0.05]">
                <div className="relative mt-0.5">
                  <input type="checkbox" className="sr-only peer" checked={settings.isAutoApprove} onChange={(e) => update("isAutoApprove", e.target.checked)} />
                  <div className="h-5 w-9 rounded-full bg-white/10 peer-checked:bg-amber-400 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <span>
                  <span className="block text-sm font-medium">Auto-publish without review</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">⚠️ Videos go live without approval. Keep off during testing.</span>
                </span>
              </label>
            </div>

            {/* Platform connections */}
            <div className="mt-6 border-t border-white/[0.08] pt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Platform connections</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {/* YouTube */}
                <div className={`flex items-center justify-between rounded-xl border p-3 ${connections.youtube === "connected" ? "border-red-300/20 bg-red-300/[0.04]" : "border-white/[0.08] bg-white/[0.02]"}`}>
                  <div className="flex items-center gap-2.5">
                    <Youtube className={`h-4 w-4 ${connections.youtube === "connected" ? "text-red-400" : "text-slate-500"}`} />
                    <div>
                      <p className="text-xs font-semibold">YouTube</p>
                      <p className={`text-[10px] ${connections.youtube === "connected" ? "text-emerald-300" : connections.youtube === "loading" ? "text-slate-500" : "text-slate-500"}`}>
                        {connections.youtube === "loading" ? "Checking…" : connections.youtube === "connected" ? "● Connected" : "○ Not connected"}
                      </p>
                    </div>
                  </div>
                  <button type="button"
                    onClick={() => { window.location.href = "/api/auth/youtube?action=connect"; }}
                    className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-300 transition hover:border-red-300/30 hover:bg-red-300/[0.06]">
                    {connections.youtube === "connected" ? "Reconnect" : "Connect"}
                  </button>
                </div>

                {/* Instagram */}
                <div className={`flex items-center justify-between rounded-xl border p-3 ${connections.instagram === "connected" ? "border-pink-300/20 bg-pink-300/[0.04]" : "border-white/[0.08] bg-white/[0.02]"}`}>
                  <div className="flex items-center gap-2.5">
                    <Instagram className={`h-4 w-4 ${connections.instagram === "connected" ? "text-pink-400" : "text-slate-500"}`} />
                    <div>
                      <p className="text-xs font-semibold">Instagram</p>
                      <p className={`text-[10px] ${connections.instagram === "connected" ? "text-emerald-300" : connections.instagram === "loading" ? "text-slate-500" : "text-slate-500"}`}>
                        {connections.instagram === "loading" ? "Checking…" : connections.instagram === "connected" ? "● Connected" : "○ Not connected"}
                      </p>
                    </div>
                  </div>
                  <button type="button"
                    onClick={() => { window.location.href = "/api/auth/instagram?action=connect"; }}
                    className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-300 transition hover:border-pink-300/30 hover:bg-pink-300/[0.06]">
                    {connections.instagram === "connected" ? "Reconnect" : "Connect"}
                  </button>
                </div>
              </div>
            </div>

            {/* Save */}
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/[0.08] pt-5">
              <Link href="/dashboard/new-prompt"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06]">
                <Zap className="h-4 w-4 text-violet-300" /> Generate video
              </Link>
              <button type="button" disabled={saving || loading} onClick={save}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold shadow-lg shadow-violet-900/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving…" : saved ? "Saved!" : "Save settings"}
              </button>
            </div>

            {/* Feedback */}
            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] p-3 text-sm text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </div>
            )}
            {saved && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] p-3 text-sm text-emerald-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> Settings saved successfully.
              </div>
            )}
          </div>

          {/* ── RIGHT: Video inspector + Workflow ── */}
          <div className="space-y-5">

            {/* Video preflight */}
            <section className={`${cardCls} p-5 sm:p-6`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-cyan-200">
                    <FileVideo className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.14em]">Video preflight</span>
                  </div>
                  <h2 className="mt-2 text-xl font-semibold">Inspect before upload</h2>
                  <p className="mt-1 text-sm leading-5 text-slate-400">Check duration, resolution and file size locally — nothing is uploaded.</p>
                </div>
                <span className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-500">02 / REVIEW</span>
              </div>

              <input ref={fileRef} type="file" className="sr-only"
                accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.mov,.webm,.m4v"
                onChange={(e) => acceptFile(e.target.files?.[0])} />

              {!videoFile ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`mt-5 flex min-h-36 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-7 text-center transition ${dragging ? "border-violet-300/60 bg-violet-300/[0.08]" : "border-violet-300/25 bg-violet-300/[0.035] hover:border-violet-300/50 hover:bg-violet-300/[0.06]"}`}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-300/10 text-violet-200">
                    <Upload className="h-5 w-5" />
                  </span>
                  <span className="mt-3 text-sm font-semibold">Drop video or click to browse</span>
                  <span className="mt-1 text-xs text-slate-500">MP4, MOV, WebM · up to 500 MB</span>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                    <video key={videoUrl} src={videoUrl} controls playsInline preload="metadata"
                      onLoadedMetadata={onMetadata}
                      onError={() => { setVideoError("Cannot preview — try MP4 (H.264)."); setVideoBusy(false); }}
                      className="max-h-[260px] w-full bg-black" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Film className="h-4 w-4 shrink-0 text-violet-300" />
                      <span className="truncate text-sm font-medium">{videoFile.name}</span>
                    </div>
                    <button onClick={clearVideo} className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/[0.06]">
                      <XCircle className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              )}

              {videoBusy && (
                <p className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                  <LoaderCircle className="h-4 w-4 animate-spin text-violet-300" /> Reading metadata…
                </p>
              )}
              {videoError && (
                <p className="mt-4 flex items-start gap-2 rounded-xl border border-rose-300/20 bg-rose-300/[0.06] p-3 text-sm text-rose-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {videoError}
                </p>
              )}

              {videoReport && (
                <>
                  <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {[
                      { label: "Duration",     value: formatDuration(videoReport.duration), Icon: Clock3 },
                      { label: "Resolution",   value: `${videoReport.width}×${videoReport.height}`, Icon: Gauge },
                      { label: "File size",    value: formatBytes(videoReport.size), Icon: HardDrive },
                      { label: "Aspect",       value: videoReport.ratio >= 1.7 ? "16:9" : videoReport.ratio <= 0.62 ? "9:16" : `${videoReport.ratio.toFixed(2)}:1`, Icon: BarChart3 },
                    ].map(({ label, value, Icon }) => (
                      <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                        <Icon className="h-3.5 w-3.5 text-slate-500" />
                        <p className="mt-2.5 break-words text-sm font-semibold">{value}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold">Preflight checklist</p>
                      <span className="text-[10px] text-slate-500">{checks.filter(c => c.ok).length}/{checks.length} passed</span>
                    </div>
                    <ul className="mt-2.5 space-y-2">
                      {checks.map((c) => (
                        <li key={c.label} className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] p-3">
                          {c.ok
                            ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                            : <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />}
                          <div>
                            <p className="text-xs font-medium">{c.label}</p>
                            <p className="mt-0.5 text-[10px] leading-4 text-slate-400">{c.detail}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              <p className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.03] p-3 text-[11px] leading-5 text-amber-100/70">
                Local preflight only — no upload, no AI analysis.
              </p>
            </section>

            {/* Workflow checklist */}
            <section className={`${cardCls} p-5`}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-300/10 text-violet-200">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Pre-automation checklist</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Complete all stages before enabling autopilot</p>
                </div>
              </div>
              <ol className="mt-4 space-y-2.5">
                {[
                  { n: "01", title: "Topic & script",    desc: "Generate and review AI script",      done: true },
                  { n: "02", title: "Voice-over",        desc: "Confirm audio rendered correctly",   done: connections.youtube !== "loading" },
                  { n: "03", title: "Video render",      desc: "Preview final exported file",        done: false },
                  { n: "04", title: "Thumbnail review",  desc: "Check title, tags, thumbnail",       done: false },
                  { n: "05", title: "YouTube connected", desc: "Authorize channel upload access",    done: connections.youtube === "connected" },
                ].map(({ n, title, desc, done }) => (
                  <li key={n} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${done ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border border-violet-300/20 bg-violet-300/[0.07] text-violet-300"}`}>{n}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-200">{title}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">{desc}</p>
                    </div>
                    {done
                      ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      : <span className="mt-0.5 text-[9px] text-slate-600 uppercase tracking-widest">todo</span>}
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-7 flex flex-col items-center justify-between gap-2 border-t border-white/[0.07] pt-5 text-center text-xs text-slate-600 sm:flex-row sm:text-left">
          <span>YouTubeAuto.ai · Review-first workflow</span>
          <span>Saving settings does not start the scheduler automatically.</span>
        </footer>
      </div>
    </main>
  );
}
