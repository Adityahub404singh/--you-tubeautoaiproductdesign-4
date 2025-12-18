"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { CheckCircle2, Upload, Eye } from "lucide-react"

interface StepFiveProps {
  formData: {
    subtitlesEnabled: boolean
    autoUpload: boolean
    approvalRequired: boolean
  }
  updateFormData: (data: Partial<StepFiveProps["formData"]>) => void
}

export function StepFive({ formData, updateFormData }: StepFiveProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Final Touches</h2>
        <p className="text-muted-foreground">Configure automation and approval settings</p>
      </div>

      <div className="space-y-5">
        <div className="flex items-start justify-between p-4 rounded-lg border">
          <div className="flex items-start gap-3 flex-1">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <Label htmlFor="subtitles" className="text-base">
                Enable Subtitles
              </Label>
              <p className="text-sm text-muted-foreground">Auto-generate and burn-in subtitles for better engagement</p>
            </div>
          </div>
          <Switch
            id="subtitles"
            checked={formData.subtitlesEnabled}
            onCheckedChange={(checked) => updateFormData({ subtitlesEnabled: checked })}
          />
        </div>

        <div className="flex items-start justify-between p-4 rounded-lg border">
          <div className="flex items-start gap-3 flex-1">
            <Upload className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <Label htmlFor="auto-upload" className="text-base">
                Auto-Upload to YouTube
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically publish videos to your channel at scheduled times
              </p>
            </div>
          </div>
          <Switch
            id="auto-upload"
            checked={formData.autoUpload}
            onCheckedChange={(checked) => updateFormData({ autoUpload: checked })}
          />
        </div>

        <div className="flex items-start justify-between p-4 rounded-lg border">
          <div className="flex items-start gap-3 flex-1">
            <Eye className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <Label htmlFor="approval" className="text-base">
                Require Approval Before Publishing
              </Label>
              <p className="text-sm text-muted-foreground">Review and approve each video before it goes live</p>
            </div>
          </div>
          <Switch
            id="approval"
            checked={formData.approvalRequired}
            onCheckedChange={(checked) => updateFormData({ approvalRequired: checked })}
          />
        </div>

        <div className="p-4 bg-muted rounded-lg space-y-2">
          <p className="text-sm font-medium text-foreground">You're all set!</p>
          <p className="text-sm text-muted-foreground">
            Click "Complete Setup" to finish onboarding and access your dashboard. You can change all these settings
            anytime.
          </p>
        </div>
      </div>
    </div>
  )
}
