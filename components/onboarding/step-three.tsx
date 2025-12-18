"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

interface StepThreeProps {
  formData: { contentStrategy: string; videoFrequency: string }
  updateFormData: (data: Partial<StepThreeProps["formData"]>) => void
}

export function StepThree({ formData, updateFormData }: StepThreeProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Content Strategy</h2>
        <p className="text-muted-foreground">Tell us about your content niche for 30-day AI generation</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="strategy">Main Topic / Category</Label>
          <Textarea
            id="strategy"
            placeholder="Example: AI Tools & Technology - covering latest AI updates, tool reviews, and tutorials in Hindi"
            value={formData.contentStrategy}
            onChange={(e) => updateFormData({ contentStrategy: e.target.value })}
            rows={5}
          />
          <p className="text-xs text-muted-foreground">
            AI will automatically generate 30 days of video topics based on this
          </p>
        </div>

        <div className="space-y-3">
          <Label>Video Frequency</Label>
          <RadioGroup
            value={formData.videoFrequency}
            onValueChange={(value) => updateFormData({ videoFrequency: value })}
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg border">
              <RadioGroupItem value="daily" id="daily" />
              <Label htmlFor="daily" className="cursor-pointer flex-1">
                Daily (1 video per day)
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border">
              <RadioGroupItem value="every-2-days" id="every-2-days" />
              <Label htmlFor="every-2-days" className="cursor-pointer flex-1">
                Every 2 days
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border">
              <RadioGroupItem value="weekly" id="weekly" />
              <Label htmlFor="weekly" className="cursor-pointer flex-1">
                Weekly
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm">
            <strong>What happens next:</strong> AI will create 30 unique video topics, generate scripts daily, create
            videos, and auto-upload at your scheduled time!
          </p>
        </div>
      </div>
    </div>
  )
}
