"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { StepOne } from "@/components/onboarding/step-one"
import { StepTwo } from "@/components/onboarding/step-two"
import { StepThree } from "@/components/onboarding/step-three"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/lib/auth-context"
import { store } from "@/lib/store"

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    channelName: "",
    category: "",
    language: "hindi",
    voice: "male-hindi",
    defaultTags: "AI, Tech, Hindi, Tutorial",
    privacy: "public",
    uploadTime: "18:00",
    contentStrategy: "",
    videoFrequency: "daily",
  })

  const totalSteps = 3

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      if (user && store) {
        const channel = store.createChannel({
          userId: user.id,
          name: formData.channelName || "My Channel",
          subscribers: 0,
          category: formData.category || "Tech",
          language: formData.language,
          voice: formData.voice,
          defaultTags: formData.defaultTags,
          privacy: formData.privacy as "public" | "unlisted",
          uploadTime: formData.uploadTime,
          contentStrategy: formData.contentStrategy,
          isActive: true,
        })

        // Generate 30-day schedule
        store.generate30DaySchedule(channel.id, formData.contentStrategy)

        // Mark user as completed setup
        store.updateUser(user.id, { hasCompletedSetup: true })
      }

      router.push("/dashboard")
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 py-12">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to YouTubeAuto.ai</h1>
            <p className="text-muted-foreground">Let's set up your automated YouTube content creation</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ${
                    index + 1 < currentStep
                      ? "bg-primary text-primary-foreground"
                      : index + 1 === currentStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-card rounded-lg border p-8 mb-6">
            {currentStep === 1 && <StepOne formData={formData} updateFormData={updateFormData} />}
            {currentStep === 2 && <StepTwo formData={formData} updateFormData={updateFormData} />}
            {currentStep === 3 && <StepThree formData={formData} updateFormData={updateFormData} />}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={prevStep}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            ) : (
              <div />
            )}
            <Button onClick={nextStep}>{currentStep === totalSteps ? "Start Auto Schedule" : "Continue"}</Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
