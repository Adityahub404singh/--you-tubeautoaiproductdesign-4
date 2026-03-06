"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Settings, User, Youtube, LayoutDashboard, Video, Shield } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { store, type Channel, getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead, requestBrowserNotificationPermission } from "@/lib/store"

interface DashboardHeaderProps {
  selectedChannel: string
  onChannelChange: (channel: string) => void
}

export function DashboardHeader({ selectedChannel, onChannelChange }: DashboardHeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [channels, setChannels] = useState<Channel[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Request browser notification permission on first load
    requestBrowserNotificationPermission()
  }, [])

  useEffect(() => {
    if (user) {
      const notifs = getNotifications(user.id)
      setNotifications(notifs.slice(0, 10)) // Show last 10
      setUnreadCount(getUnreadNotificationCount(user.id))
    }
  }, [user])

  const handleNotificationClick = (notif: any) => {
    if (user) {
      markNotificationRead(user.id, notif.id)
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const handleMarkAllRead = () => {
    if (user) {
      markAllNotificationsRead(user.id)
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }
  }

  useEffect(() => {
    if (user && store) {
      const userChannels = store.getChannels(user.id)
      setChannels(userChannels)
    }
  }, [user])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Youtube className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">YouTubeAuto.ai</span>
            </Link>

            <nav className="hidden md:flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/my-videos">
                  <Video className="h-4 w-4 mr-2" />
                  My Videos
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/channels">
                  <Youtube className="h-4 w-4 mr-2" />
                  Channels
                </Link>
              </Button>
              {user?.role === "admin" && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Link>
                </Button>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {channels.length > 0 && (
              <Select value={selectedChannel} onValueChange={onChannelChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline">
                      Mark all read
                    </button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <DropdownMenuItem 
                      key={notif.id} 
                      className={`flex flex-col items-start gap-1 p-3 ${!notif.read ? 'bg-primary/5' : ''}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className="font-medium text-sm">{notif.title}</span>
                        {!notif.read && <span className="h-2 w-2 rounded-full bg-primary ml-auto" />}
                      </div>
                      <span className="text-xs text-muted-foreground line-clamp-2">{notif.message}</span>
                      {notif.youtubeUrl && (
                        <a 
                          href={notif.youtubeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View on YouTube →
                        </a>
                      )}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/billing">Billing</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
