"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { CheckCircle, Loader2, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { CreatorRequestDialog } from "@/components/creator/creator-request-dialog"
import { CreatorRequestStatusCard } from "@/components/creator/creator-request-status-card"
import { useCreatorRequest } from "@/hooks/use-creator-request"

export default function BecomeCreatorPage() {
  const router = useRouter()
  const {
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
  } = useCreatorRequest()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await submit()
  }

  if (isCheckingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (existingRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-purple-950/10 to-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Logo className="mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Demande de Statut Créateur</h1>
          </div>

          <CreatorRequestStatusCard
            request={existingRequest}
            onBack={() => router.push("/dashboard")}
            onResubmit={existingRequest.status === "rejected" ? openDialog : undefined}
          />
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-purple-950/10 to-background px-4">
        <Card className="max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Demande envoyée !</h2>
          <p className="text-foreground/70 mb-4">Votre demande a été soumise avec succès.</p>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-blue-400 mb-2">Veuillez attendre votre réponse</p>
            <p className="text-sm text-foreground/60">
              Vous recevrez un email à <strong>{formValues.email}</strong> une fois que votre demande aura été examinée.
            </p>
          </div>
          <p className="text-sm text-foreground/50">Redirection vers le tableau de bord...</p>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-background via-purple-950/10 to-background py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Logo className="mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Devenir Créateur sur AmrVerse
            </h1>
            <p className="text-foreground/70 max-w-2xl mx-auto">
              Partagez vos manhwas avec la communauté ! Cliquez sur le bouton ci-dessous pour soumettre votre candidature en tant que créateur.
            </p>
          </div>

          <Card className="p-8 text-center">
            <Sparkles className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">Prêt à partager votre créativité ?</h2>
            <p className="text-foreground/70 mb-6 max-w-xl mx-auto">
              En tant que créateur, vous pourrez publier vos propres manhwas, gérer vos chapitres, et interagir avec une communauté passionnée de lecteurs.
            </p>

            <div className="bg-muted/50 p-6 rounded-lg mb-6">
              <h3 className="font-semibold mb-3">Avantages créateur :</h3>
              <ul className="text-sm text-foreground/70 space-y-2 text-left max-w-md mx-auto">
                <li>✅ Publier un nombre illimité de manhwas</li>
                <li>✅ Gérer vos chapitres et pages facilement</li>
                <li>✅ Suivre les statistiques de vos œuvres</li>
                <li>✅ Construire votre communauté de fans</li>
              </ul>
            </div>

            <Button onClick={openDialog} size="lg" className="min-w-[200px]">
              <Sparkles className="w-5 h-5 mr-2" />
              Faire une demande
            </Button>
          </Card>
        </div>
      </div>

      <CreatorRequestDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onSubmit={handleSubmit}
        values={formValues}
        onFieldChange={updateField}
        error={error}
        loading={isSubmitting}
        user={user}
        disabled={isSubmitDisabled}
      />
    </>
  )
}
