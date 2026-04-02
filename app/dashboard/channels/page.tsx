"use client";
import { useState, useEffect } from "react";
import { Instagram, Link2 } from "lucide-react";

export default function ChannelsPage() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("channels") || "[]");
    setChannels(saved);
    setLoading(false);

    // Check for Instagram connection
    const params = new URLSearchParams(window.location.search);
    if (params.get("instagram_connected")) {
      alert("Instagram connected successfully!");
    }
  }, []);

  const connectInstagram = () => {
    window.location.href = "/api/auth/instagram?action=connect";
  };

  const disconnectInstagram = () => {
    const updated = channels.filter(c => c.platform !== "instagram");
    localStorage.setItem("channels", JSON.stringify(updated));
    setChannels(updated);
  };

  const igChannel = channels.find(c => c.platform === "instagram");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Connected Platforms</h1>
      
      {/* YouTube Channel */}
      <div className="border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">YT</span>
            </div>
            <div>
              <h3 className="font-semibold">YouTube</h3>
              <p className="text-sm text-gray-500">Connected</p>
            </div>
          </div>
          <a href="/api/auth/youtube?action=connect" className="text-red-600 hover:underline">
            Manage
          </a>
        </div>
      </div>

      {/* Instagram Channel */}
      <div className="border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-full flex items-center justify-center">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Instagram</h3>
              <p className="text-sm text-gray-500">
                {igChannel ? "Connected" : "Not connected"}
              </p>
            </div>
          </div>
          {igChannel ? (
            <button onClick={disconnectInstagram} className="text-red-600 hover:underline">
              Disconnect
            </button>
          ) : (
            <button onClick={connectInstagram} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg hover:opacity-90">
              Connect Instagram
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
