"use client";
import { useState, useEffect } from "react";
import { Youtube, Instagram, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function YouTubeConnect() {
  const [ytConnected, setYtConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkConnections = async () => {
      try {
        const [ytRes, igRes] = await Promise.all([
          fetch("/api/youtube/status").catch(() => ({ json: () => ({ connected: false }) })),
          fetch("/api/instagram/status").catch(() => ({ json: () => ({ connected: false }) }))
        ]);
        const ytData = await ytRes.json();
        const igData = await igRes.json();
        setYtConnected(ytData.connected);
        setIgConnected(igData.connected);
      } catch (error) {
        console.error("Status check failed", error);
      } finally {
        setLoading(false);
      }
    };
    checkConnections();
  }, []);

  const handleYTConnect = () => {
    const clientId = "99624088216-6cum4cmnrmlc1lqn75n870cb80i0cnl9.apps.googleusercontent.com";
    const redirectUri = encodeURIComponent("http://localhost:3000/api/youtube/callback");
    const scope = encodeURIComponent("https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube");
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
    window.location.href = authUrl;
  };

  const handleIGConnect = () => window.location.href = "/api/auth/instagram?action=connect";

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10 bg-black/40 border border-white/10 rounded-2xl">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <div className={`p-6 rounded-2xl border backdrop-blur-md transition-all ${ytConnected ? 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-black/40 border-white/10'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${ytConnected ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              <Youtube className={`w-6 h-6 ${ytConnected ? 'text-emerald-400' : 'text-red-500'}`} />
            </div>
            <div>
              <h3 className="font-bold text-white">YouTube</h3>
              <p className="text-xs text-slate-400">Auto-upload videos</p>
            </div>
          </div>
          {ytConnected ? (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full"><CheckCircle className="w-3 h-3"/> CONNECTED</span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-white/5 px-3 py-1 rounded-full"><XCircle className="w-3 h-3"/> NOT CONNECTED</span>
          )}
        </div>
        {!ytConnected && (
          <button onClick={handleYTConnect} className="w-full mt-2 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:scale-[1.02]">
            Connect YouTube Channel
          </button>
        )}
      </div>

      <div className={`p-6 rounded-2xl border backdrop-blur-md transition-all ${igConnected ? 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-black/40 border-white/10'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${igConnected ? 'bg-emerald-500/20' : 'bg-pink-500/20'}`}>
              <Instagram className={`w-6 h-6 ${igConnected ? 'text-emerald-400' : 'text-pink-500'}`} />
            </div>
            <div>
              <h3 className="font-bold text-white">Instagram</h3>
              <p className="text-xs text-slate-400">Auto-post Reels</p>
            </div>
          </div>
          {igConnected ? (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full"><CheckCircle className="w-3 h-3"/> CONNECTED</span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-white/5 px-3 py-1 rounded-full"><XCircle className="w-3 h-3"/> NOT CONNECTED</span>
          )}
        </div>
        {!igConnected && (
          <button onClick={handleIGConnect} className="w-full mt-2 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:scale-[1.02]">
            Connect Instagram Account
          </button>
        )}
      </div>
    </div>
  );
}
