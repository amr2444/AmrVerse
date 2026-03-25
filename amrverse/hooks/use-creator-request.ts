"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getCreatorRequest, submitCreatorRequest, validateCreatorRequest, type CreatorRequestFormValues } from "@/lib/services/creator-client"
import type { CreatorRequest } from "@/lib/types"

function getInitialFormValues(email?: string): CreatorRequestFormValues {
  return {
    fullName: "",
    email: email || "",
    presentation: "",
    motivation: "",
    portfolioUrl: "",
  }
}

export function useCreatorRequest() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [existingRequest, setExistingRequest] = useState<CreatorRequest | null>(null)
  const [formValues, setFormValues] = useState<CreatorRequestFormValues>(getInitialFormValues())

  useEffect(() => {
    if (user?.email) {
      setFormValues((current) => ({ ...current, email: current.email || user.email }))
    }
  }, [user?.email])

  const loadExistingRequest = useCallback(async () => {
    try {
      const response = await getCreatorRequest()
      setExistingRequest(response.data ?? null)
    } catch {
      setExistingRequest(null)
    } finally {
      setIsCheckingStatus(false)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      router.push("/auth?redirect=/become-creator")
      return
    }

    if (user.isCreator) {
      router.push("/admin/upload-content")
      return
    }

    void loadExistingRequest()
  }, [loadExistingRequest, router, user])

  useEffect(() => {
    if (!existingRequest || existingRequest.status !== "pending") {
      return
    }

    const interval = setInterval(() => {
      void refreshUser()
    }, 10_000)

    return () => clearInterval(interval)
  }, [existingRequest, refreshUser])

  const openDialog = useCallback(() => {
    if (!user) {
      router.push("/auth?redirect=/become-creator")
      return
    }

    if (user.isCreator) {
      router.push("/admin/upload-content")
      return
    }

    if (existingRequest) {
      setFormValues({
        fullName: existingRequest.fullName,
        email: existingRequest.email,
        presentation: existingRequest.presentation,
        motivation: existingRequest.motivation,
        portfolioUrl: existingRequest.portfolioUrl || "",
      })
    }

    setShowDialog(true)
  }, [existingRequest, router, user])

  const updateField = useCallback(<K extends keyof CreatorRequestFormValues>(field: K, value: CreatorRequestFormValues[K]) => {
    setFormValues((current) => ({ ...current, [field]: value }))
  }, [])

  const submit = useCallback(async () => {
    const validationError = validateCreatorRequest(formValues)
    if (validationError) {
      setError(validationError)
      return false
    }

    setError("")
    setIsSubmitting(true)

    try {
      await submitCreatorRequest({
        ...formValues,
        fullName: formValues.fullName || user?.username || "Utilisateur",
        email: formValues.email || user?.email || "",
        portfolioUrl: formValues.portfolioUrl || undefined,
      })

      setSuccess(true)
      setShowDialog(false)
      setTimeout(() => router.push("/dashboard"), 3000)
      return true
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Une erreur est survenue")
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [formValues, router, user?.email, user?.username])

  const isSubmitDisabled = useMemo(
    () =>
      isSubmitting ||
      formValues.presentation.length < 50 ||
      formValues.motivation.length < 50 ||
      !formValues.fullName ||
      !formValues.email,
    [formValues.email, formValues.fullName, formValues.motivation.length, formValues.presentation.length, isSubmitting],
  )

  return {
    user,
    isCheckingStatus,
    isSubmitting,
    error,
    success,
    showDialog,
    existingRequest,
    formValues,
    isSubmitDisabled,
    setShowDialog,
    openDialog,
    updateField,
    submit,
  }
}
