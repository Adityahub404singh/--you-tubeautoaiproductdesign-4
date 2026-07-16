"use client";
import { useState, useEffect } from "react";
import { Instagram, Youtube } from "lucide-react";

export default function ChannelsPage() {
  const [ytConnected, setYtConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const [ytRes, igRes] = await Promise.all([
          fetch("/api/youtube/status").catch(() => ({ json: () => ({ connected: false }) })),
          fetch("/api/instagram/status").catch(() => ({ json: () => ({ connected: false }) })),
        ]);
        const ytData = await ytRes.json();
        const igData = await igRes.json();
        setYtConnected(!!ytData.connected);
        setIgConnected(!!igData.connected);
      } catch (e) {
        console.error("Status check failed", e);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, []);

  const connectYouTube = () => { window.location.href = "/api/auth/youtube?action=connect"; };
  const connectInstagram = () => { window.location.href = "/api/auth/instagram?action=connect"; };

  if (loading) {
    return <div className="p-6 text-white">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-white">Connected Platforms</h1>

      <div className="border border-white/10 rounded-lg p-4 mb-4 bg-black/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
              <Youtube className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">YouTube</h3>
              <p className="text-sm text-gray-400">{ytConnected ? "Connected" : "Not connected"}</p>
            </div>
          </div>
          {!ytConnected && (
            <button onClick={connectYouTube} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:opacity-90">
              Connect YouTube
            </button>
          )}
        </div>
      </div>

      <div className="border border-white/10 rounded-lg p-4 mb-4 bg-black/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-full flex items-center justify-center">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Instagram</h3>
              <p className="text-sm text-gray-400">{igConnected ? "Connected" : "Not connected"}</p>
            </div>
          </div>
          {!igConnected && (
            <button onClick={connectInstagram} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg hover:opacity-90">
              Connect Instagram
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
