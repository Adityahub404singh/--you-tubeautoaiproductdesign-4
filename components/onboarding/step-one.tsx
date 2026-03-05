"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Youtube, CheckCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { signIn, useSession } from "next-auth/react"

interface StepOneProps {
  formData: { channelName: string; category: string }
  updateFormData: (data: Partial<StepOneProps["formData"]>) => void
}

export function StepOne({ formData, updateFormData }: StepOneProps) {
  const { data: session } = useSession()
  const isConnected = !!session?.accessToken

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Connect Your YouTube Channel</h2>
        <p className="text-muted-foreground">Set up your channel details and category</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="channel-name">Channel Name</Label>
          <Input
            id="channel-name"
            type="text"
            placeholder="My Tech Channel"
            value={formData.channelName}
            onChange={(e) => updateFormData({ channelName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => updateFormData({ category: value })}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Science & Tech">Science & Tech</SelectItem>
              <SelectItem value="Gaming">Gaming</SelectItem>
              <SelectItem value="Education">Education</SelectItem>
              <SelectItem value="Entertainment">Entertainment</SelectItem>
              <SelectItem value="Vlogs">Vlogs</SelectItem>
              <SelectItem value="Business">Business</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">Connect with YouTube OAuth:</p>
          {isConnected ? (
            <div className="flex items-center gap-2 text-green-500 font-medium">
              <CheckCircle className="h-5 w-5" />
              YouTube Connected as {session?.user?.name}
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full bg-transparent"
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
            >
              <Youtube className="h-4 w-4 mr-2" />
              Connect with YouTube
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
