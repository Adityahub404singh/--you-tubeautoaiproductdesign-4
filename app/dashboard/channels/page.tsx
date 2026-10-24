"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Instagram,
  Youtube,
  RefreshCw,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

type ConnectionStatus = {
  connected: boolean;
};

export default function ChannelsPage() {
  const [ytConnected, setYtConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState<"youtube" | "instagram" | null>(
    null
  );

  const checkConnections = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [ytRes, igRes] = await Promise.all([
        fetch("/api/youtube/status", { cache: "no-store" }),
        fetch("/api/instagram/status", { cache: "no-store" }),
      ]);

      const [ytData, igData] = await Promise.all([
        ytRes.json().catch(() => ({})),
        igRes.json().catch(() => ({})),
      ]);

      if (!ytRes.ok) {
        throw new Error(
          ytData.error || `YouTube status failed (${ytRes.status})`
        );
      }

      if (!igRes.ok) {
        throw new Error(
          igData.error || `Instagram status failed (${igRes.status})`
        );
      }

      const ytStatus = ytData as ConnectionStatus;
      const igStatus = igData as ConnectionStatus;

      setYtConnected(ytStatus.connected === true);
      setIgConnected(igStatus.connected === true);
    } catch (err) {
      console.error("Connection status check failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Connection status check nahi ho paaya."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void checkConnections();
  }, [checkConnections]);

  const connectYouTube = () => {
    setConnecting("youtube");
    window.location.assign("/api/auth/youtube?action=connect");
  };

  const connectInstagram = () => {
    setConnecting("instagram");
    window.location.assign("/api/auth/instagram?action=connect");
  };

  const connectedCount = Number(ytConnected) + Number(igConnected);

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center bg-zinc-950 text-white">
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Checking connected platforms...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium tracking-wider text-purple-400">
              ACCOUNT INTEGRATIONS
            </p>

            <h1 className="text-3xl font-bold tracking-tight">
              Connected Platforms
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
              Connect your social accounts to manage your content publishing
              workflow from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void checkConnections(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm transition hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </header>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-400">Connected accounts</p>
              <p className="mt-1 text-2xl font-bold">
                {connectedCount} <span className="text-zinc-500">/ 2</span>
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${(connectedCount / 2) * 100}%` }}
            />
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">Unable to check connection</p>
              <p className="mt-1 break-words">{error}</p>
              <button
                type="button"
                onClick={() => void checkConnections(true)}
                className="mt-3 font-medium underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Your platforms</h2>

          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-zinc-700 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-500/10">
                  <Youtube className="h-7 w-7 text-red-500" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold">YouTube</h3>

                  <p className="mt-1 text-sm leading-6 text-zinc-400">
                    Connect your YouTube channel to upload and publish videos.
                  </p>

                  <div className="mt-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                        ytConnected
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-zinc-700 bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          ytConnected ? "bg-emerald-400" : "bg-zinc-500"
                        }`}
                      />
                      {ytConnected ? "Connected" : "Not connected"}
                    </span>
                  </div>
                </div>
              </div>

              {ytConnected ? (
                <span className="inline-flex items-center gap-2 text-sm text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Active
                </span>
              ) : (
                <button
                  type="button"
                  onClick={connectYouTube}
                  disabled={connecting !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {connecting === "youtube" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                  Connect YouTube
                </button>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-zinc-700 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-400/20">
                  <Instagram className="h-7 w-7 text-pink-400" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold">Instagram</h3>

                  <p className="mt-1 text-sm leading-6 text-zinc-400">
                    Connect your Instagram account for supported publishing
                    features.
                  </p>

                  <div className="mt-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                        igConnected
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-zinc-700 bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          igConnected ? "bg-emerald-400" : "bg-zinc-500"
                        }`}
                      />
                      {igConnected ? "Connected" : "Not connected"}
                    </span>
                  </div>
                </div>
              </div>

              {igConnected ? (
                <span className="inline-flex items-center gap-2 text-sm text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Active
                </span>
              ) : (
                <button
                  type="button"
                  onClick={connectInstagram}
                  disabled={connecting !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 px-5 py-3 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {connecting === "instagram" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                  Connect Instagram
                </button>
              )}
            </div>
          </article>
        </section>

        <p className="text-xs leading-5 text-zinc-500">
          Connection status depends on your platform API routes and OAuth
          configuration. Connecting an account does not automatically guarantee
          that publishing permissions are enabled.
        </p>
      </div>
    </main>
  );
}
