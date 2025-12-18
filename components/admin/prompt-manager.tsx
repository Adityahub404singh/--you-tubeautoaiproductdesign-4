"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { TrendingUp, Save, TestTube } from "lucide-react"

export function PromptManager() {
  const [currentPrompt, setCurrentPrompt] = useState(
    "Create a viral YouTube Short about [TOPIC]:\n- Hook: Show shocking statistic in first 3 seconds\n- Problem: Show 3 issues (with visuals)\n- Solution: Show 3 actionable tips\n- CTA: 'Comment which tip you'll try first'\n- Length: 45-59 seconds\n- Add trending music and text overlays",
  )

  const [trendingTopics] = useState(["AI Tools 2026", "Side Hustles", "Crypto News", "Fitness Tips", "Tech Reviews"])

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Prompt Management</CardTitle>
        <CardDescription>Update the master prompt for video generation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trending Topics */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Trending Topics Today</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingTopics.map((topic) => (
              <Badge key={topic} variant="secondary">
                {topic}
              </Badge>
            ))}
          </div>
        </div>

        {/* Current Prompt */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Master Prompt Template</label>
          <Textarea
            value={currentPrompt}
            onChange={(e) => setCurrentPrompt(e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">Use [TOPIC] as a placeholder for user-specific content</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Success Rate</p>
            <p className="text-2xl font-bold">68%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Views</p>
            <p className="text-2xl font-bold">12.4K</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
          <Button variant="outline" className="flex-1 bg-transparent">
            <TestTube className="h-4 w-4 mr-2" />
            Test Prompt
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
