"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Settings, Trash2, Youtube, Users, Video, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/lib/auth-context"
import { youtubeAuth, type YouTubeChannel } from "@/lib/youtube-auth"
import { store } from "@/lib/store"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ChannelsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [channels, setChannels] = useState(store?.getChannels(user?.id) || [])
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      setSuccess("YouTube account connected successfully!")
      setTimeout(() => setSuccess(null), 5000)
    }
    if (searchParams.get("error")) {
      setError("Failed to connect YouTube account. Please try again.")
      setTimeout(() => setError(null), 5000)
    }
  }, [searchParams])

  useEffect(() => {
    if (user?.id) {
      setChannels(store?.getChannels(user.id) || [])
    }
  }, [user?.id])

  const handleConnectYouTube = () => {
    setIsConnecting(true)
    youtubeAuth?.initiateAuth()
  }

  const planLimits =
    user?.role === "admin"
      ? { channels: "Unlimited", videos: "Unlimited", plan: "Admin" }
      : user?.plan === "agency"
        ? { channels: "Unlimited", videos: "Unlimited", plan: "Agency" }
        : user?.plan === "pro"
          ? { channels: 5, videos: 300, plan: "Pro" }
          : { channels: 1, videos: 30, plan: "Free" }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardHeader selectedChannel="main-channel" onChannelChange={() => {}} />

        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="space-y-6">
            {success && (
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-500">{success}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Channel Management</h1>
                <p className="text-muted-foreground mt-1">Manage your connected YouTube channels</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Channel
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Connect New YouTube Channel</DialogTitle>
                    <DialogDescription>Add another channel to automate content creation</DialogDescription>
                  </DialogHeader>
                  <AddChannelForm
                    onConnect={handleConnectYouTube}
                    isConnecting={isConnecting}
                    userId={user?.id || ""}
                    onChannelAdded={() => {
                      if (user?.id) {
                        setChannels(store?.getChannels(user.id) || [])
                      }
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Plan Usage</CardTitle>
                <CardDescription>Your current subscription limits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Channels</span>
                      <span className="text-sm text-muted-foreground">
                        {channels.length} / {planLimits.channels}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width:
                            planLimits.channels === "Unlimited"
                              ? "100%"
                              : `${(channels.length / Number(planLimits.channels)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Free Videos Remaining</span>
                      <span className="text-sm text-muted-foreground">{user?.freeVideosRemaining || 0} / 10</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${((user?.freeVideosRemaining || 0) / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Current Plan</span>
                      <Badge>{planLimits.plan}</Badge>
                    </div>
                    {!user?.role && (
                      <p className="text-xs text-muted-foreground mt-2">
                        After 10 free videos: $0.20/video (11-50), $0.18 (51-100), $0.16 (101+)
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {channels.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Youtube className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No channels connected</h3>
                    <p className="text-muted-foreground mb-4">
                      Connect your YouTube channel to start automating content creation
                    </p>
                    <Button onClick={handleConnectYouTube} disabled={isConnecting}>
                      <Youtube className="h-4 w-4 mr-2" />
                      {isConnecting ? "Connecting..." : "Connect YouTube Channel"}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                channels.map((channel) => (
                  <Card key={channel.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Youtube className="h-8 w-8 text-primary" />
                          </div>
                          <div className="flex-1 space-y-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold">{channel.name}</h3>
                                <Badge variant={channel.isActive ? "default" : "secondary"}>
                                  {channel.isActive ? "active" : "paused"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{channel.category}</p>
                            </div>

                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{channel.subscribers} subscribers</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Video className="h-4 w-4 text-muted-foreground" />
                                <span>{channel.language}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                <span className="text-green-500">Active</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Channel Settings</DialogTitle>
                                <DialogDescription>Configure automation settings for {channel.name}</DialogDescription>
                              </DialogHeader>
                              <ChannelSettingsForm channel={channel} />
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this channel?")) {
                                store?.deleteChannel(channel.id)
                                if (user?.id) {
                                  setChannels(store?.getChannels(user.id) || [])
                                }
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

function AddChannelForm({
  onConnect,
  isConnecting,
  userId,
  onChannelAdded,
}: {
  onConnect: () => void
  isConnecting: boolean
  userId: string
  onChannelAdded: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [ytChannels, setYtChannels] = useState<YouTubeChannel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const fetchChannels = async () => {
    setLoading(true)
    setError(null)
    try {
      const channels = await youtubeAuth?.getUserChannels()
      if (channels && channels.length > 0) {
        setYtChannels(channels)
      } else {
        setError("No YouTube channels found. Please make sure you have a YouTube channel.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch channels")
    } finally {
      setLoading(false)
    }
  }

  const handleAddChannel = () => {
    if (!selectedChannel) {
      setError("Please select a channel")
      return
    }

    const channel = ytChannels.find((c) => c.id === selectedChannel)
    if (!channel) return

    store?.createChannel({
      userId,
      name: channel.title,
      subscribers: Number.parseInt(channel.subscriberCount) || 0,
      category: "Technology",
      language: "English",
      voice: "Male",
      defaultTags: "",
      privacy: "public",
      uploadTime: "14:00",
      contentStrategy: "",
      isActive: true,
    })

    onChannelAdded()
    setYtChannels([])
    setSelectedChannel("")
  }

  return (
    <div className="space-y-4">
      {ytChannels.length === 0 ? (
        <>
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Connect with YouTube OAuth</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Click below to securely connect your YouTube account. We'll fetch your channel details automatically.
            </p>
            {youtubeAuth?.isAuthenticated() ? (
              <Button onClick={fetchChannels} disabled={loading} className="w-full">
                {loading ? "Fetching Channels..." : "Fetch My Channels"}
              </Button>
            ) : (
              <Button onClick={onConnect} disabled={isConnecting} className="w-full">
                <Youtube className="h-4 w-4 mr-2" />
                {isConnecting ? "Connecting..." : "Connect with YouTube"}
              </Button>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label>Select Channel</Label>
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a channel" />
              </SelectTrigger>
              <SelectContent>
                {ytChannels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    {channel.title} ({channel.subscriberCount} subscribers)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setYtChannels([])
                setSelectedChannel("")
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddChannel}>Add Channel</Button>
          </div>
        </>
      )}
    </div>
  )
}

function ChannelSettingsForm({ channel }: { channel: any }) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="content-mode">Content Mode</Label>
          <Select defaultValue="master-prompt">
            <SelectTrigger id="content-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="master-prompt">Master Prompt</SelectItem>
              <SelectItem value="daily-prompt">Daily Prompt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="master-prompt">Master Prompt</Label>
          <Textarea
            id="master-prompt"
            placeholder="Describe your content strategy..."
            rows={4}
            defaultValue={
              channel.contentStrategy || "Create daily tech news videos covering AI, startups, and gadgets."
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="frequency">Video Frequency</Label>
            <Select defaultValue={channel.uploadTime || "daily"}>
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="every-2-days">Every 2 Days</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="posting-time">Posting Time</Label>
            <Select defaultValue={channel.uploadTime || "14:00"}>
              <SelectTrigger id="posting-time">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10:00">10:00 AM</SelectItem>
                <SelectItem value="14:00">2:00 PM</SelectItem>
                <SelectItem value="18:00">6:00 PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="voice-language">Voice Language</Label>
            <Select defaultValue={channel.language || "en"}>
              <SelectTrigger id="voice-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="voice-gender">Voice Gender</Label>
            <Select defaultValue={channel.voice || "male"}>
              <SelectTrigger id="voice-gender">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="voice-accent">Voice Accent</Label>
            <Select defaultValue="us">
              <SelectTrigger id="voice-accent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us">US</SelectItem>
                <SelectItem value="uk">UK</SelectItem>
                <SelectItem value="in">Indian</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h4 className="font-medium">Automation Settings</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Subtitles</Label>
              <p className="text-sm text-muted-foreground">Auto-generate subtitles</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Upload</Label>
              <p className="text-sm text-muted-foreground">Automatically publish videos</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Approval</Label>
              <p className="text-sm text-muted-foreground">Review before publishing</p>
            </div>
            <Switch />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline">Cancel</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  )
}
