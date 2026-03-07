"use client";
import { useState } from "react";

export default function VideoGenerateUpload() {
  const [step, setStep] = useState("idle"); // idle, generating, uploading, done, error
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({ audioUrl: "", thumbnailUrl: "", title: "", tags: "ai,viral,trending" });

  const handleGenerate = async () => {
    if (!form.audioUrl || !form.thumbnailUrl || !form.title) return alert("Sab fields bharo!");
    setStep("generating");
    try {
      // Step 1: MP4 banao
      const genRes = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl: form.audioUrl, thumbnailUrl: form.thumbnailUrl, title: form.title }),
      });
      const genData = await genRes.json();
      if (!genData.success) throw new Error(genData.error);

      setStep("uploading");

      // Step 2: YouTube pe upload karo
      const upRes = await fetch("/api/youtube/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: `http://localhost:3000${genData.videoUrl}`,
          title: form.title,
          tags: form.tags.split(",").map(t => t.trim()),
          privacyStatus: "private",
          language: "hi",
        }),
      });
      const upData = await upRes.json();
      if (!upData.success) throw new Error(upData.error);

      setResult(upData);
      setStep("done");
    } catch (err) {
      setResult({ error: err.message });
      setStep("error");
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 mt-4">
      <h2 className="text-xl font-bold text-white mb-4">🎬 Video Banao + YouTube Upload</h2>
      <div className="space-y-3 mb-4">
        <input className="w-full p-3 bg-gray-700 text-white rounded-lg text-sm" placeholder="🎵 Audio URL (MP3)" value={form.audioUrl} onChange={e => setForm({...form, audioUrl: e.target.value})} />
        <input className="w-full p-3 bg-gray-700 text-white rounded-lg text-sm" placeholder="🖼️ Thumbnail URL (JPG/PNG)" value={form.thumbnailUrl} onChange={e => setForm({...form, thumbnailUrl: e.target.value})} />
        <input className="w-full p-3 bg-gray-700 text-white rounded-lg text-sm" placeholder="📝 Video Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
        <input className="w-full p-3 bg-gray-700 text-white rounded-lg text-sm" placeholder="🏷️ Tags (comma separated)" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
      </div>

      <button onClick={handleGenerate} disabled={step === "generating" || step === "uploading"}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-bold text-lg transition">
        {step === "idle" && "🚀 Video Banao aur YouTube pe Upload Karo"}
        {step === "generating" && "⏳ FFmpeg se MP4 ban raha hai..."}
        {step === "uploading" && "📤 YouTube pe upload ho raha hai..."}
        {step === "done" && "✅ YouTube pe Upload Ho Gaya!"}
        {step === "error" && "❌ Error aaya, dobara try karo"}
      </button>

      {step === "done" && result && (
        <div className="mt-4 p-4 bg-green-900 rounded-lg">
          <p className="text-green-300 font-bold">✅ Video YouTube pe upload ho gayi!</p>
          <a href={result.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline text-sm break-all">{result.youtubeUrl}</a>
          <p className="text-gray-400 text-xs mt-1">Status: {result.status} (private) | ID: {result.videoId}</p>
        </div>
      )}
      {step === "error" && result && (
        <div className="mt-4 p-4 bg-red-900 rounded-lg">
          <p className="text-red-300">❌ Error: {result.error}</p>
        </div>
      )}
    </div>
  );
}
