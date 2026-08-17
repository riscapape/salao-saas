'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { CheckCircle2, MessageCircle } from 'lucide-react'
import {
  buildBenefitText,
  buildMessage,
  formatValidity,
  waLink,
} from '@/lib/messages'
import type { SalonInfo } from '@/lib/salon'
import type { SegmentClient, SegmentKey } from '@/lib/segments'
import { markConverted, markMessageSent } from '@/app/app/segmentos/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const COOLDOWN_DAYS = 7

export function ClientWhatsActions({
  client,
  segment,
  salon,
  professionalName,
  lastSentAt,
  converted,
}: {
  client: SegmentClient
  segment: SegmentKey
  salon: SalonInfo
  professionalName: string
  lastSentAt: string | null
  converted: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const daysSinceSent = lastSentAt
    ? differenceInCalendarDays(new Date(), parseISO(lastSentAt))
    : null

  async function handleSend() {
    if (daysSinceSent != null && daysSinceSent < COOLDOWN_DAYS) {
      const ok = window.confirm(
        `Esta cliente recebeu mensagem há ${daysSinceSent === 0 ? 'pouco tempo' : `${daysSinceSent} dia(s)`}. Enviar mesmo assim?`
      )
      if (!ok) return
    }

    setBusy(true)
    try {
      const benefitText =
        segment === 'birthday' ? buildBenefitText(salon) : null
      const validity =
        segment === 'birthday' && benefitText
          ? formatValidity(salon.bday_valid_until)
          : null

      const message = buildMessage(segment, {
        clientName: client.name,
        lastService: client.lastServiceName,
        daysSince: client.daysSinceLastVisit,
        salonName: salon.name,
        professionalName,
        benefitText,
        validity,
      })

      window.open(waLink(client.whatsapp, message), '_blank', 'noopener,noreferrer')

      await markMessageSent({ clientId: client.id, segment, message })
      toast.success('WhatsApp aberto e envio registrado.')
      router.refresh()
    } catch {
      toast.error('Algo deu errado. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  async function handleConverted() {
    setBusy(true)
    await markConverted({ clientId: client.id, segment })
    toast.success('Que ótimo! Vamos registrar a visita.')
    router.push(`/app/atendimentos/novo?client=${client.id}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {converted ? (
        <Badge>
          <CheckCircle2 className="mr-1 h-3 w-3" /> Reativada
        </Badge>
      ) : (
        <>
          <Button size="sm" onClick={handleSend} disabled={busy}>
            <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
          </Button>
          {daysSinceSent != null && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleConverted}
                disabled={busy}
              >
                Voltou!
              </Button>
              <Badge variant="outline">
                contatada {daysSinceSent === 0 ? 'hoje' : `há ${daysSinceSent}d`}
              </Badge>
            </>
          )}
        </>
      )}
    </div>
  )
}