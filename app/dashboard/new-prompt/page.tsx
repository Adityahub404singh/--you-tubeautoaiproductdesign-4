"use client"

import type React from "react"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "lucide-react"
import { useRouter } from "next/navigation"

export default function NewPromptPage() {
  const router = useRouter()
  const [contentMode, setContentMode] = useState("master-prompt")
  const [prompt, setPrompt] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] New prompt submitted:", { contentMode, prompt })
    // Redirect back to dashboard
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader selectedChannel="main-channel" onChannelChange={() => {}} />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Create New Content</h1>
            <p className="text-muted-foreground mt-1">Generate videos with AI automation</p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Content Generation</CardTitle>
                <CardDescription>Choose your content creation mode and provide instructions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Content Mode</Label>
                  <RadioGroup value={contentMode} onValueChange={setContentMode}>
                    <div className="flex items-start space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="master-prompt" id="master-prompt" />
                      <div className="space-y-1">
                        <Label htmlFor="master-prompt" className="cursor-pointer">
                          Master Prompt (30-Day Calendar)
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Provide one prompt and generate 30 days of automated content
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="daily-prompt" id="daily-prompt" />
                      <div className="space-y-1">
                        <Label htmlFor="daily-prompt" className="cursor-pointer">
                          Daily Prompt (Single Video)
                        </Label>
                        <p className="text-sm text-muted-foreground">Create one video based on your daily topic</p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prompt">{contentMode === "master-prompt" ? "Master Prompt" : "Daily Topic"}</Label>
                  <Textarea
                    id="prompt"
                    placeholder={
                      contentMode === "master-prompt"
                        ? "Example: Create daily tech news videos covering AI trends, startup news, and gadget reviews. Keep it under 5 minutes, casual but informative tone."
                        : "Example: Today's topic - OpenAI's latest GPT-5 announcement and its impact on the AI industry"
                    }
                    rows={6}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    {contentMode === "master-prompt"
                      ? "Describe your content strategy, topics, style, and any specific requirements"
                      : "Provide the specific topic or idea for today's video"}
                  </p>
                </div>

                {contentMode === "master-prompt" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Video Frequency</Label>
                      <Select defaultValue="daily">
                        <SelectTrigger id="frequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily (30 videos)</SelectItem>
                          <SelectItem value="every-2-days">Every 2 Days (15 videos)</SelectItem>
                          <SelectItem value="weekly">Weekly (4 videos)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Select defaultValue="today">
                        <SelectTrigger id="start-date">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="tomorrow">Tomorrow</SelectItem>
                          <SelectItem value="next-week">Next Week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  <p className="text-sm">
                    {contentMode === "master-prompt"
                      ? "Your 30-day content calendar will be generated automatically"
                      : "This video will be added to your content calendar"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
                Cancel
              </Button>
              <Button type="submit">{contentMode === "master-prompt" ? "Generate Calendar" : "Create Video"}</Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
