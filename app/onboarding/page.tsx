
"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import {
  Youtube,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Video,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { store, type Video as VideoType, type Channel } from "@/lib/store";
import Link from "next/link";

const statusConfig: Record<
  string,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  live: {
    label: "Live on YouTube",
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    icon: CheckCircle2,
  },
  approved: {
    label: "Approved",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: CheckCircle2,
  },
  "pending-approval": {
    label: "Pending Approval",
    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    icon: Clock,
  },
  uploading: {
    label: "Uploading...",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: Clock,
  },
  failed: {
    label: "Upload Failed",
    color: "bg-red-500/10 text-red-500 border-red-500/20",
    icon: AlertTriangle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-500/10 text-red-500 border-red-500/20",
    icon: AlertTriangle,
  },
  "user-approved": {
    label: "User Approved",
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    icon: CheckCircle2,
  },
};

function VideoThumb({ video }: { video: VideoType }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (
      video.thumbnail?.startsWith("data:") ||
      video.thumbnail?.startsWith("http") ||
      video.thumbnail?.startsWith("/")
    ) {
      setSrc(video.thumbnail);
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setSrc("");
        return;
      }

      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(48, 130, 110, 38);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px Arial";
      ctx.fillText("VIDEO", 62, 156);

      ctx.font = "bold 48px Arial";
      const title = video.title || "Untitled Video";
      const words = title.split(/\s+/);
      let line = "";
      let y = 240;

      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;

        if (ctx.measureText(candidate).width > 1000 && line) {
          ctx.fillText(line, 60, y);
          line = word;
          y += 65;

          if (y > 580) break;
        } else {
          line = candidate;
        }
      }

      if (line && y <= 580) {
        ctx.fillText(line, 60, y);
      }

      setSrc(canvas.toDataURL("image/jpeg", 0.85));
    } catch (error) {
      console.error("Thumbnail generation failed:", error);
      setSrc("");
    }
  }, [video.id, video.thumbnail, video.title]);

  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-900">
        <Video className="h-8 w-8 text-gray-600" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={video.title || "Video thumbnail"}
      className="h-full w-full object-cover"
    />
  );
}

export default function MyVideosPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [videos, setVideos] = useState<VideoType[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadVideos = useCallback(() => {
    if (authLoading) return;

    setError("");

    if (!user?.id) {
      setChannels([]);
      setVideos([]);
      setIsLoading(false);
      return;
    }

    if (!store) {
      setError("Video store is unavailable. Refresh the page and try again.");
      setChannels([]);
      setVideos([]);
      setIsLoading(false);
      return;
    }

    try {
      // Load only channels owned by the current user.
      const userChannels = store.getChannels(user.id);
      setChannels(userChannels);

      const allVideos: VideoType[] = [];

      for (const channel of userChannels) {
        const channelVideos = store.getVideos(channel.id);
        allVideos.push(...channelVideos);
      }

      allVideos.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      setVideos(allVideos);
    } catch (err) {
      console.error("Unable to load videos:", err);
      setError("Videos load nahi ho paaye. Please refresh and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const liveCount = videos.filter((video) => video.status === "live").length;

  const pendingCount = videos.filter((video) =>
    ["pending-approval", "approved", "uploading", "user-approved"].includes(
      video.status
    )
  ).length;

  const failedCount = videos.filter((video) =>
    ["failed", "rejected"].includes(video.status)
  ).length;

  const filteredVideos =
    activeTab === "all"
      ? videos
      : activeTab === "live"
        ? videos.filter((video) => video.status === "live")
        : activeTab === "pending"
          ? videos.filter((video) =>
              ["pending-approval", "approved", "uploading", "user-approved"].includes(
                video.status
              )
            )
          : videos.filter((video) =>
              ["failed", "rejected"].includes(video.status)
            );

  const getChannelName = (channelId: string) =>
    channels.find((channel) => channel.id === channelId)?.name ||
    "Unknown Channel";

  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
      ? "Date unavailable"
      : parsedDate.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardHeader
          selectedChannel={channels[0]?.id || ""}
          onChannelChange={() => loadVideos()}
        />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">My Videos</h1>
              <p className="mt-1 text-muted-foreground">
                {videos.length} total videos &bull; {liveCount} live on YouTube
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={loadVideos}
                disabled={isLoading || authLoading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>

              <Link href="/dashboard/new-prompt">
                <Button className="gap-2 bg-red-600 hover:bg-red-700">
                  <Plus className="h-4 w-4" />
                  Create New Video
                </Button>
              </Link>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {[
              { key: "all", label: `All (${videos.length})` },
              { key: "live", label: `Live (${liveCount})` },
              { key: "pending", label: `Pending (${pendingCount})` },
              { key: "failed", label: `Failed (${failedCount})` },
            ].map((tab) => (
              <button
                type="button"
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-red-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-red-500/30 p-4 text-sm text-red-500"
            >
              {error}
            </div>
          )}

          {isLoading || authLoading ? (
            <div className="py-24 text-center text-muted-foreground">
              Loading your videos...
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Video className="mb-4 h-16 w-16 text-muted-foreground/30" />

              <h3 className="mb-2 text-xl font-semibold">
                {videos.length === 0 ? "No videos yet" : "No videos in this category"}
              </h3>

              <p className="mb-6 text-muted-foreground">
                {videos.length === 0
                  ? "Create your first AI video to see it here."
                  : "Try selecting another filter."}
              </p>

              {videos.length === 0 && (
                <Link href="/dashboard/new-prompt">
                  <Button className="bg-red-600 hover:bg-red-700">
                    Create Your First Video
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredVideos.map((video) => {
                const config =
                  statusConfig[video.status] || statusConfig["pending-approval"];
                const StatusIcon = config.icon;

                return (
                  <div
                    key={video.id}
                    className="overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg"
                  >
                    <div className="relative aspect-video bg-gray-900">
                      <VideoThumb video={video} />

                      <div
                        className={`absolute right-2 top-2 flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${config.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="mb-2 line-clamp-2 text-sm font-semibold">
                        {video.title}
                      </h3>

                      <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Youtube className="h-3 w-3 text-red-500" />
                        <span>{getChannelName(video.channelId)}</span>
                        <span>&bull;</span>
                        <span>{formatDate(video.createdAt)}</span>
                      </div>

                      {video.tags && video.tags.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1">
                          {video.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={`${tag}-${index}`}
                              className="rounded bg-muted px-2 py-0.5 text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Score:
                          </span>
                          <span className="text-xs font-bold text-green-500">
                            {video.aiScore || 0}/100
                          </span>
                        </div>

                        {video.youtubeUrl && (
                          <a
                            href={video.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View on YouTube
                          </a>
                        )}
                      </div>

                      {video.status === "failed" && video.uploadError && (
                        <p className="mt-2 line-clamp-2 text-xs text-red-400">
                          {video.uploadError}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
