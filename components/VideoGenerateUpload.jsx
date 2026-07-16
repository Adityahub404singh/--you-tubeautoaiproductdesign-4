"use client";
import { useState } from "react";
import { Loader2, Zap, Youtube, Instagram, Cloud } from "lucide-react";

export default function VideoGenerateUpload() {
  const [step, setStep] = useState("idle");
  const [stepDetail, setStepDetail] = useState("");
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({ title: "", caption: "", tags: "viral,trending", category: "psychology", videoType: "shorts" });

  const CATS = [
    { id: "psychology", label: "🔤 Psychology" }, { id: "motivation", label: "🔤 Motivation" }, { id: "stoicism", label: "🔤 Stoicism" },
    { id: "quotes", label: "🔤 Quotes" }, { id: "businesslessons", label: "🔤 Business" }, { id: "storytelling", label: "🔤 Story" },
    { id: "startupstories", label: "🎬 Startups" }, { id: "luxury", label: "🎬 Luxury" }, { id: "history", label: "🎬 History" },
    { id: "pov", label: "🤖 AI POV" }, { id: "horror", label: "🤖 AI Horror" }, { id: "ainews", label: "🤖 AI News" }
  ];

  const handleGenerate = async () => {
    if (!form.title) return alert("Please enter a topic/title!");
    setStep("generating"); setResult(null);

    try {
      setStepDetail("Activating AI Brain for Viral Script...");
      const aiRes = await fetch("/api/videos/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: form.title, mode: form.category, category: form.category, language: "Hindi" })
      });
      const aiData = await aiRes.json();
      if (!aiRes.ok) throw new Error(aiData.error || "AI failed to write script");

      setStepDetail("Synthesizing Neural Voice...");
      const voiceRes = await fetch("/api/voiceover", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiData.script, title: aiData.title, category: form.category, isShorts: form.videoType === "shorts" })
      });
      const voiceData = await voiceRes.json();

      setStepDetail("Zenith Engine Rendering Video...");
      const g = await fetch("/api/video/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioUrl: voiceData.audioUrl || "",
          title: aiData.title,
          script: aiData.script,
          pexelsQuery: aiData.pexelsQuery,
          videoType: form.videoType,
          category: form.category
        }),
      });
      const gd = await g.json();
      if (!gd.success) throw new Error(gd.error || "Render failed");
      const { videoUrl, shortsUrl, videoId } = gd;

      const res = { video: gd, youtube: null, cloudinary: null, instagram: null };

      setStep("uploading");
      setStepDetail("Blasting to YouTube & Instagram...");

      const uploadYT = fetch("/api/youtube/upload", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, videoUrl, title: aiData.title, description: aiData.description, tags: form.tags.split(",").map(t => t.trim()), category: form.category, privacyStatus: "public" }),
      }).then(r => r.json()).catch(e => ({ error: e.message }));

      const uploadIG = fetch("/api/instagram/upload", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: shortsUrl || videoUrl, videoId, title: aiData.title, caption: aiData.description, category: form.category }),
      }).then(r => r.json()).catch(e => ({ error: e.message }));

      const [yd, id] = await Promise.all([uploadYT, uploadIG]);

      if (yd.success) res.youtube = { success: true, url: "https://youtube.com/watch?v=" + yd.videoId };
      else if (yd.queued) res.youtube = { queued: true, message: yd.message };
      else res.youtube = { error: yd.error };

      if (id.success) res.instagram = { success: true, url: id.url };
      else res.instagram = { error: id.error };

      setResult(res); setStep("done"); setStepDetail("All Systems Go! 🎉");

    } catch(err) {
      setResult({ error: err.message });
      setStep("error");
    }
  };

  const isLoading = step === "generating" || step === "uploading";

  return (
    <div className="p-6 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 mt-8 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/20 rounded-lg"><Zap className="h-5 w-5 text-purple-400" /></div>
        <h2 className="text-xl font-bold text-white tracking-wide">Quick Deploy Engine</h2>
      </div>

      <div className="space-y-4 mb-6">
        <input className="w-full p-4 bg-white/5 border border-white/10 text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all" placeholder="Enter viral topic (e.g. 3 Sigma rules)" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />

        <div className="grid grid-cols-2 gap-4">
          <select className="p-4 bg-white/5 border border-white/10 text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-zinc-900" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
            {CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select className="p-4 bg-white/5 border border-white/10 text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-zinc-900" value={form.videoType} onChange={e => setForm({...form, videoType: e.target.value})}>
            <option value="shorts">Vertical (Shorts/Reels)</option>
            <option value="long">Landscape (Long Form)</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="mb-6 p-5 bg-purple-900/20 rounded-xl border border-purple-500/30 flex items-center gap-4">
          <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
          <div>
            <p className="text-sm font-bold text-purple-300">{step === "generating" ? "Synthesizing Video..." : "Deploying to Networks..."}</p>
            <p className="text-xs text-purple-400/70 mt-1">{stepDetail}</p>
          </div>
        </div>
      )}

      <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:opacity-50 text-white py-4 rounded-xl font-extrabold text-sm uppercase tracking-widest transition-all hover:scale-[1.02] shadow-lg">
        {step === "idle" ? "Generate & Auto-Publish" : isLoading ? "Processing..." : step === "done" ? "Deploy Another" : "Retry Engine"}
      </button>

      {step === "done" && result && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.youtube?.success ? (
            <div className="p-4 bg-red-950/40 rounded-xl border border-red-900/50 flex justify-between items-center">
              <span className="text-red-400 font-bold flex items-center gap-2"><Youtube className="h-4 w-4"/> YouTube</span>
              <a href={result.youtube.url} target="_blank" className="text-red-300 text-xs hover:underline">View</a>
            </div>
          ) : (
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-slate-400 text-xs truncate">YT: {result.youtube?.error || result.youtube?.message}</div>
          )}
          {result.instagram?.success ? (
            <div className="p-4 bg-pink-950/40 rounded-xl border border-pink-900/50 flex justify-between items-center">
              <span className="text-pink-400 font-bold flex items-center gap-2"><Instagram className="h-4 w-4"/> Instagram</span>
              <a href={result.instagram.url} target="_blank" className="text-pink-300 text-xs hover:underline">View</a>
            </div>
          ) : (
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-slate-400 text-xs truncate">IG: {result.instagram?.error}</div>
          )}
        </div>
      )}
      {step === "error" && result?.error && <div className="mt-6 p-4 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-sm">{result.error}</div>}
    </div>
  );
}
