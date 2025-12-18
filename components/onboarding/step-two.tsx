"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface StepTwoProps {
  formData: { language: string; voice: string; defaultTags: string; privacy: string; uploadTime: string }
  updateFormData: (data: Partial<StepTwoProps["formData"]>) => void
}

export function StepTwo({ formData, updateFormData }: StepTwoProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Your Style Preferences</h2>
        <p className="text-muted-foreground">Customize how your videos will be created</p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select value={formData.language} onValueChange={(value) => updateFormData({ language: value })}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hindi">Hindi</SelectItem>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="voice">Voice</Label>
            <Select value={formData.voice} onValueChange={(value) => updateFormData({ voice: value })}>
              <SelectTrigger id="voice">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male-hindi">Male Hindi</SelectItem>
                <SelectItem value="female-hindi">Female Hindi</SelectItem>
                <SelectItem value="male-english">Male English</SelectItem>
                <SelectItem value="female-english">Female English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Default Tags</Label>
          <Input
            id="tags"
            placeholder="AI, Tech, Hindi, Tutorial"
            value={formData.defaultTags}
            onChange={(e) => updateFormData({ defaultTags: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">Separate tags with commas</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="privacy">Privacy</Label>
            <Select value={formData.privacy} onValueChange={(value) => updateFormData({ privacy: value })}>
              <SelectTrigger id="privacy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="unlisted">Unlisted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="upload-time">Upload Time</Label>
            <Select value={formData.uploadTime} onValueChange={(value) => updateFormData({ uploadTime: value })}>
              <SelectTrigger id="upload-time">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="06:00">6:00 AM</SelectItem>
                <SelectItem value="09:00">9:00 AM</SelectItem>
                <SelectItem value="14:00">2:00 PM</SelectItem>
                <SelectItem value="18:00">6:00 PM</SelectItem>
                <SelectItem value="20:00">8:00 PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
