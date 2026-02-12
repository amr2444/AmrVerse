"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Loader2, Sparkles, Clock, XCircle } from "lucide-react"
import { Logo } from "@/components/logo"

export default function BecomeCreatorPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [existingRequest, setExistingRequest] = useState<any>(null)

  const [formData, setFormData] = useState({
    fullName: "",
    email: user?.email || "",
    presentation: "",
    motivation: "",
    portfolioUrl: "",
  })

  // Vérifier si l'utilisateur a déjà une demande
  useEffect(() => {
    if (!user || !token) {
      router.push("/auth")
      return
    }

    // Si déjà créateur, rediriger
    if (user.isCreator) {
      router.push("/admin/upload-content")
      return
    }

    checkExistingRequest()
  }, [user, token])

  const checkExistingRequest = async () => {
    try {
      const res = await fetch("/api/creator-requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        if (data.data) {
          setExistingRequest(data.data)
        }
      }
    } catch (err) {
      console.error("Error checking request:", err)
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Validation
    if (formData.presentation.length < 50) {
      setError("Votre présentation doit contenir au moins 50 caractères")
      setLoading(false)
      return
    }

    if (formData.motivation.length < 50) {
      setError("Votre motivation doit contenir au moins 50 caractères")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/creator-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Échec de l'envoi")
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
      }, 3000)
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Si demande existante
  if (existingRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-purple-950/10 to-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Logo className="mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Demande de Statut Créateur</h1>
          </div>

          <Card className="p-8 text-center">
            {existingRequest.status === "pending" && (
              <>
                <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Demande en cours de traitement</h2>
                <p className="text-foreground/70 mb-4">
                  Votre demande a été reçue le {new Date(existingRequest.createdAt).toLocaleDateString("fr-FR")}
                </p>
                <p className="text-foreground/60">
                  Veuillez patienter pendant que notre équipe examine votre candidature. 
                  Vous recevrez une réponse par email dans les plus brefs délais.
                </p>
              </>
            )}

            {existingRequest.status === "rejected" && (
              <>
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Demande refusée</h2>
                <p className="text-foreground/70 mb-4">
                  Votre demande a été examinée et n'a pas été approuvée.
                </p>
                {existingRequest.adminNotes && (
                  <div className="bg-muted p-4 rounded-lg mb-4">
                    <p className="text-sm font-medium mb-1">Note de l'administrateur :</p>
                    <p className="text-foreground/70">{existingRequest.adminNotes}</p>
                  </div>
                )}
                <Button onClick={() => router.push("/dashboard")}>
                  Retour au tableau de bord
                </Button>
              </>
            )}
          </Card>
        </div>
      </div>
    )
  }

  // Formulaire de demande
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-purple-950/10 to-background px-4">
        <Card className="max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Demande envoyée !</h2>
          <p className="text-foreground/70 mb-4">
            Votre demande a été soumise avec succès.
          </p>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-blue-400 mb-2">
              Veuillez attendre votre réponse
            </p>
            <p className="text-sm text-foreground/60">
              Vous recevrez un email à <strong>{formData.email}</strong> une fois que 
              votre demande aura été examinée.
            </p>
          </div>
          <p className="text-sm text-foreground/50">
            Redirection vers le tableau de bord...
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-purple-950/10 to-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Logo className="mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Devenir Créateur sur AmrVerse
          </h1>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            Partagez vos manhwas avec la communauté ! Remplissez ce formulaire pour soumettre 
            votre candidature en tant que créateur.
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom complet */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Votre nom et prénom"
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="votre@email.com"
                required
                disabled={loading}
              />
              <p className="text-xs text-foreground/50 mt-1">
                Vous recevrez la réponse à cette adresse
              </p>
            </div>

            {/* Présentation */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Présentez-vous <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={formData.presentation}
                onChange={(e) => setFormData({ ...formData, presentation: e.target.value })}
                placeholder="Qui êtes-vous ? Quelle est votre expérience dans la création de manhwas ou de contenus similaires ?"
                rows={6}
                required
                disabled={loading}
                className="resize-none"
              />
              <p className="text-xs text-foreground/50 mt-1">
                {formData.presentation.length}/50 caractères minimum
              </p>
            </div>

            {/* Motivation */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Qu'est-ce que vous voulez créer ? <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={formData.motivation}
                onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                placeholder="Décrivez vos projets, vos idées, ce que vous souhaitez partager avec la communauté AmrVerse..."
                rows={6}
                required
                disabled={loading}
                className="resize-none"
              />
              <p className="text-xs text-foreground/50 mt-1">
                {formData.motivation.length}/50 caractères minimum
              </p>
            </div>

            {/* Portfolio (optionnel) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Portfolio ou lien vers vos travaux (optionnel)
              </label>
              <Input
                type="url"
                value={formData.portfolioUrl}
                onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                placeholder="https://..."
                disabled={loading}
              />
              <p className="text-xs text-foreground/50 mt-1">
                Site web, Instagram, Behance, etc.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || formData.presentation.length < 50 || formData.motivation.length < 50}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Soumettre ma candidature
                </>
              )}
            </Button>

            <p className="text-xs text-center text-foreground/50">
              En soumettant ce formulaire, vous acceptez que votre demande soit examinée par notre équipe.
            </p>
          </form>
        </Card>
      </div>
    </div>
  )
}
