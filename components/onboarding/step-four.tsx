"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mic, Languages, Globe } from "lucide-react"

interface StepFourProps {
  formData: {
    voiceGender: string
    voiceLanguage: string
    voiceAccent: string
  }
  updateFormData: (data: Partial<StepFourProps["formData"]>) => void
}

export function StepFour({ formData, updateFormData }: StepFourProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Voice & Language Settings</h2>
        <p className="text-muted-foreground">Customize the voice that will narrate your videos</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="language" className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Voice Language
          </Label>
          <Select value={formData.voiceLanguage} onValueChange={(value) => updateFormData({ voiceLanguage: value })}>
            <SelectTrigger id="language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">Hindi</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="pt">Portuguese</SelectItem>
              <SelectItem value="ja">Japanese</SelectItem>
              <SelectItem value="zh">Chinese</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Voice Gender
          </Label>
          <Select value={formData.voiceGender} onValueChange={(value) => updateFormData({ voiceGender: value })}>
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select voice gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accent" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Voice Accent
          </Label>
          <Select value={formData.voiceAccent} onValueChange={(value) => updateFormData({ voiceAccent: value })}>
            <SelectTrigger id="accent">
              <SelectValue placeholder="Select accent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="us">US</SelectItem>
              <SelectItem value="uk">UK</SelectItem>
              <SelectItem value="au">Australian</SelectItem>
              <SelectItem value="in">Indian</SelectItem>
              <SelectItem value="ca">Canadian</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
          <p className="text-sm font-medium text-foreground">Preview Your Voice</p>
          <p className="text-sm text-muted-foreground">
            After completing setup, you can preview and change voice settings in your dashboard
          </p>
        </div>
      </div>
    </div>
  )
}
