'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { endOfMonth, format } from 'date-fns'
import { toast } from 'sonner'
import { Gift, Settings2 } from 'lucide-react'
import type { SalonInfo } from '@/lib/salon'
import { saveBirthdaySettings } from '@/app/app/segmentos/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function BirthdaySettingsDialog({ salon }: { salon: SalonInfo }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [includeBenefit, setIncludeBenefit] = useState(
    salon.bday_benefit_type !== 'none'
  )
  const [benefitType, setBenefitType] = useState<string>(
  salon.bday_benefit_type === 'none' ? 'percent' : salon.bday_benefit_type
)
  const [benefitValue, setBenefitValue] = useState(
    salon.bday_benefit_value != null ? String(salon.bday_benefit_value) : ''
  )
  const [benefitDesc, setBenefitDesc] = useState(salon.bday_benefit_desc ?? '')
  const [validUntil, setValidUntil] = useState(salon.bday_valid_until ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const suggestedValidity = format(endOfMonth(new Date()), 'yyyy-MM-dd')

  async function handleSave() {
    setBusy(true)
    setError(null)
    const result = await saveBirthdaySettings({
      benefitType: includeBenefit ? benefitType : 'none',
      benefitValue,
      benefitDesc,
      validUntil: includeBenefit ? validUntil : '',
    })
    setBusy(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    toast.success('Benefício de aniversário salvo.')
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Settings2 className="mr-2 h-4 w-4" /> Benefício do mês
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Benefício de aniversário</DialogTitle>
            <DialogDescription>
              Opcional: inclua um presente nas mensagens de aniversário.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={includeBenefit}
                onChange={(e) => setIncludeBenefit(e.target.checked)}
                className="h-4 w-4"
              />
              Incluir benefício nas mensagens
            </label>

            {includeBenefit && (
              <>
                <div className="space-y-2">
                  <Label>Tipo de benefício</Label>
                  <select
                    value={benefitType}
                    onChange={(e) => setBenefitType(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="percent">% de desconto</option>
                    <option value="amount">Valor fixo de desconto (R$)</option>
                    <option value="free_service">Serviço grátis</option>
                    <option value="other">Outro</option>
                  </select>
                </div>

                {(benefitType === 'percent' || benefitType === 'amount') && (
                  <div className="space-y-2">
                    <Label>
                      {benefitType === 'percent' ? 'Percentual (%)' : 'Valor (R$)'}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step={benefitType === 'percent' ? '1' : '0.01'}
                      value={benefitValue}
                      onChange={(e) => setBenefitValue(e.target.value)}
                      placeholder={benefitType === 'percent' ? 'Ex.: 10' : 'Ex.: 30'}
                    />
                  </div>
                )}

                {(benefitType === 'free_service' || benefitType === 'other') && (
                  <div className="space-y-2">
                    <Label>Descrição do benefício</Label>
                    <Input
                      value={benefitDesc}
                      onChange={(e) => setBenefitDesc(e.target.value)}
                      placeholder={
                        benefitType === 'free_service'
                          ? 'Ex.: hidratação'
                          : 'Ex.: brinde especial'
                      }
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Válido até</Label>
                  <Input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                  <button
                    type="button"
                    className="text-xs text-primary underline"
                    onClick={() => setValidUntil(suggestedValidity)}
                  >
                    Sugerir: fim do mês
                  </button>
                </div>
              </>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button onClick={handleSave} disabled={busy}>
              {busy ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function BenefitSummary({ salon }: { salon: SalonInfo }) {
  if (salon.bday_benefit_type === 'none') {
    return (
      <p className="flex items-center gap-2 rounded-lg border bg-background p-3 text-sm text-muted-foreground">
        <Gift className="h-4 w-4" /> Sem benefício neste mês — as mensagens serão
        apenas de parabéns.
      </p>
    )
  }

  let text = ''
  if (salon.bday_benefit_type === 'percent') {
    text = `${salon.bday_benefit_value}% de desconto`
  } else if (salon.bday_benefit_type === 'amount') {
    text = `R$ ${salon.bday_benefit_value} de desconto`
  } else {
    text = salon.bday_benefit_desc ?? ''
  }

  const validity = salon.bday_valid_until
    ? format(new Date(salon.bday_valid_until + 'T00:00'), 'dd/MM')
    : null

  return (
    <p className="flex items-center gap-2 rounded-lg border bg-background p-3 text-sm">
      <Gift className="h-4 w-4 text-primary" />
      <span>
        🎁 Benefício: <strong>{text}</strong>
        {validity && ` · resgate até ${validity}`}
      </span>
    </p>
  )
}