import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Clock, History, RotateCcw, XCircle } from "lucide-react"
import type { CreatorRequest } from "@/lib/types"

export function CreatorRequestStatusCard({
  request,
  onBack,
  onResubmit,
}: {
  request: CreatorRequest
  onBack: () => void
  onResubmit?: () => void
}) {
  return (
    <Card className="p-8 text-center">
      {request.status === "pending" && (
        <>
          <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Demande en cours de traitement</h2>
          <p className="text-foreground/70 mb-4">
            Votre demande a ete recue le {new Date(request.createdAt).toLocaleDateString("fr-FR")}
          </p>
          <p className="text-foreground/60">
            Veuillez patienter pendant que notre equipe examine votre candidature. Vous recevrez une reponse par email
            dans les plus brefs delais.
          </p>
        </>
      )}

      {request.status === "rejected" && (
        <>
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Demande refusee</h2>
          <p className="text-foreground/70 mb-4">Votre demande a ete examinee et n'a pas ete approuvee.</p>
          {request.adminNotes && (
            <div className="bg-muted p-4 rounded-lg mb-4">
              <p className="text-sm font-medium mb-1">Note de l'administrateur :</p>
              <p className="text-foreground/70">{request.adminNotes}</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onResubmit && (
              <Button onClick={onResubmit}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Corriger et renvoyer
              </Button>
            )}
            <Button variant="outline" onClick={onBack}>Retour au tableau de bord</Button>
          </div>
        </>
      )}

      {!!request.auditTrail?.length && (
        <div className="mt-8 text-left border-t pt-6">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-foreground/80">
            <History className="w-4 h-4" />
            Historique de la demande
          </div>
          <div className="space-y-3">
            {request.auditTrail.map((entry) => (
              <div key={entry.id} className="rounded-lg border bg-background/60 p-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium capitalize">{entry.action}</span>
                  <span className="text-foreground/50">{new Date(entry.createdAt).toLocaleString("fr-FR")}</span>
                </div>
                {(entry.actorUsername || entry.actorType) && (
                  <p className="text-xs text-foreground/50 mt-1">
                    {entry.actorUsername ? `Par ${entry.actorUsername}` : `Source: ${entry.actorType}`}
                  </p>
                )}
                {entry.notes && <p className="text-sm text-foreground/70 mt-2">{entry.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
