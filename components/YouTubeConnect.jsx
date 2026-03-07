"use client";
import { useState, useEffect } from "react";
export default function YouTubeConnect() {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    fetch("/api/youtube/status").then(r => r.json()).then(setStatus).catch(() => setStatus({ connected: false }));
    const params = new URLSearchParams(window.location.search);
    if (params.get("youtube") === "connected") fetch("/api/youtube/status").then(r => r.json()).then(setStatus);
  }, []);
  if (status === null) return <div className="p-4 bg-gray-800 rounded-xl text-gray-400">YouTube check kar raha hai...</div>;
  if (!status.connected) return (
    <div className="p-6 bg-gray-800 rounded-xl border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-2">📺 YouTube Connect Karo</h2>
      <p className="text-gray-400 mb-4">Videos auto-upload karne ke liye YouTube connect karo</p>
      <button onClick={() => window.location.href = "/api/auth/youtube?action=connect"} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold">
        🔗 YouTube se Connect Karo
      </button>
    </div>
  );
  return (
    <div className="p-6 bg-gray-800 rounded-xl border border-green-700">
      <h2 className="text-xl font-bold text-white mb-4">📺 YouTube Connected ✅</h2>
      {status.hasChannel && (
        <div className="flex items-center gap-4 p-4 bg-gray-700 rounded-lg mb-4">
          {status.channel?.thumbnail && <img src={status.channel.thumbnail} className="w-12 h-12 rounded-full" />}
          <div>
            <p className="text-white font-semibold">{status.channel?.name}</p>
            <p className="text-gray-400 text-sm">{parseInt(status.channel?.subscribers||0).toLocaleString()} subscribers • {status.channel?.totalVideos} videos</p>
          </div>
          <span className="ml-auto px-3 py-1 bg-green-600 text-white text-xs rounded-full">✅ Live</span>
        </div>
      )}
      <button onClick={() => fetch("/api/auth/youtube/disconnect",{method:"POST"}).then(()=>setStatus({connected:false}))} className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm">
        Disconnect
      </button>
    </div>
  );
}
