"use client";

import { useCallback, useEffect, useState } from "react";
import { Instagram, Youtube, RefreshCw, ExternalLink, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

type PlatformStatus = {
  connected: boolean;
  error?: string;
};

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
        connected
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border-zinc-700 bg-zinc-800 text-zinc-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          connected ? "bg-emerald-400" : "bg-zinc-500"
        }`}
      />
      {connected ? "Connected" : "Not connected"}
    </span>
  );
}

export default function ChannelsPage() {
  const [youtube, setYoutube] = useState<PlatformStatus>({ connected: false });
  const [instagram, setInstagram] = useState<PlatformStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");
  const [connecting, setConnecting] = useState<"youtube" | "instagram" | null>(null);

  const checkConnections = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setPageError("");

    try {
      const [ytResponse, igResponse] = await Promise.all([
        fetch("/api/youtube/status", { cache: "no-store" }),
        fetch("/api/instagram/status", { cache: "no-store" }),
      ]);

      const [ytData, igData] = await Promise.all([
        ytResponse.json().catch(() => ({})),
        igResponse.json().catch(() => ({})),
      ]);

      if (!ytResponse.ok) {
        throw new Error(
          ytData.error || `YouTube status check failed (${ytResponse.status})`
        );
      }

      if (!igResponse.ok) {
        throw new Error(
          igData.error || `Instagram status check failed (${igResponse.status})`
        );
      }

      setYoutube({ connected: ytData.connected === true });
      setInstagram({ connected: igData.connected === true });
    } catch (error) {
      console.error("Connection status check failed:", error);
      setPageError(
        error instanceof Error
          ? error.message
          : "Platform connection status check nahi ho paaya."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void checkConnections();
  }, [checkConnections]);

  const connectPlatform = (platform: "youtube" | "instagram") => {
    setConnecting(platform);
    setPageError("");

    const url =
      platform === "youtube"
        ? "/api/auth/youtube?action=connect"
        : "/api/auth/instagram?action=connect";

    window.location.assign(url);
  };

  const platforms = [
    {
      id: "youtube" as const,
      name: "YouTube",
      description: "Connect your channel to upload and publish videos.",
      status: youtube,
      icon: Youtube,
      iconStyle: "bg-red-600/15 text-red-500",
      buttonStyle: "bg-red-600 hover:bg-red-500",
    },
    {
      id: "instagram" as const,
      name: "Instagram",
      description: "Connect your Instagram account for supported publishing features.",
      status: instagram,
      icon: Instagram,
      iconStyle: "bg-gradient-to-br from-purple-600/20 via-pink-500/20 to-orange-400/20 text-pink-400",
      buttonStyle: "bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90",
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-purple-400">
              ACCOUNT INTEGRATIONS
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              Connected Platforms
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
              Manage your social accounts and connect platforms for your
              content workflow.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void checkConnections(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading || refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </header>

        {pageError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Could not verify connections</p>
              <p className="mt-1 break-words text-amber-100/80">{pageError}</p>
              <p className="mt-2 text-amber-100/70">
                Status refresh karke dobara check karo.
              </p>
            </div>
          </div>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your accounts</h2>
            {!loading && (
              <span className="text-xs text-zinc-500">
                {Number(youtube.connected) + Number(instagram.connected)} of 2 connected
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                Checking platform connections...
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                const isConnecting = connecting === platform.id;

                return (
                  <article
                    key={platform.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-zinc-700 sm:p-6"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${platform.iconStyle}`}
                        >
                          <Icon className="h-7 w-7" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-semibold">
                              {platform.name}
                            </h3>
                            <StatusBadge connected={platform.status.connected} />
                          </div>

                          <p className="mt-2 text-sm leading-6 text-zinc-400">
                            {platform.description}
                          </p>

                          <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                            {platform.status.connected ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                Connection confirmed by status API
                              </>
                            ) : (
                              "Connect your account to get started"
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 sm:pl-4">
                        {platform.status.connected ? (
                          <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 px-4 py-2.5 text-sm text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            Active
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => connectPlatform(platform.id)}
                            disabled={connecting !== null}
                            className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${platform.buttonStyle}`}
                          >
                            {isConnecting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ExternalLink className="h-4 w-4" />
                            )}
                            {isConnecting
                              ? "Redirecting..."
                              : `Connect ${platform.name}`}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <p className="text-xs leading-5 text-zinc-500">
          Note: A connected account does not guarantee that every publishing
          feature is enabled. OAuth permissions, platform API access, and
          publishing requirements must also be configured.
        </p>
      </div>
    </main>
  );
}
