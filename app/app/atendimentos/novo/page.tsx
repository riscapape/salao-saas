'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { addDays, format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { saveVisit } from '../actions'
import { formatBRL } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Client = { id: string; name: string }
type Service = { id: string; name: string; price: number | null; cycle_days: number }

const formSchema = z.object({
  clientId: z.string().uuid('Selecione uma cliente'),
  visitedAt: z.string().min(1, 'Informe a data'),
  expectedReturnDays: z.string(),
  notes: z.string(),
})

type FormValues = z.infer<typeof formSchema>

export default function NovoAtendimentoPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>
}) {
  const router = useRouter()
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedServices, setSelectedServices] = useState<
    Record<string, string>
  >({})
  const [clientSearch, setClientSearch] = useState('')
  const [preselectedClient, setPreselectedClient] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: '',
      visitedAt: format(new Date(), 'yyyy-MM-dd'),
      expectedReturnDays: '',
      notes: '',
    },
  })

  
  const visitedAt = watch('visitedAt')
const clientId = watch('clientId')
const expectedReturnDays = watch('expectedReturnDays')

const previewReturn = useMemo(() => {
  const days = Number(expectedReturnDays)
  if (!visitedAt || !Number.isFinite(days) || days < 1) return null
  return format(addDays(new Date(visitedAt + 'T00:00'), days), 'dd/MM/yyyy')
}, [visitedAt, expectedReturnDays])

  useEffect(() => {
    (async () => {
      const sp = await searchParams
      if (sp.client) {
        setPreselectedClient(sp.client)
        setValue('clientId', sp.client)
      }
    })()
  }, [searchParams, setValue])

  useEffect(() => {
    let active = true
    async function load() {
      const q = supabase
        .from('clients')
        .select('id, name')
        .order('name')
        .limit(200)
      if (clientSearch.trim()) q.ilike('name', `%${clientSearch.trim()}%`)
      const { data } = await q
      if (active) setClients(data ?? [])
    }
    load()
    return () => {
      active = false
    }
  }, [clientSearch, supabase])

  useEffect(() => {
    let active = true
    async function load() {
      const { data } = await supabase
        .from('services')
        .select('id, name, price, cycle_days')
        .order('name')
      if (active) setServices(data ?? [])
    }
    load()
    return () => {
      active = false
    }
  }, [supabase])

  // Pré-seleciona cliente se veio da URL
  useEffect(() => {
    if (preselectedClient && !clientId) {
      setValue('clientId', preselectedClient)
    }
  }, [preselectedClient, clientId, setValue])

 function toggleService(service: Service) {
  setSelectedServices((prev) => {
    const next = { ...prev }
    if (next[service.id]) {
      delete next[service.id]
    } else {
      next[service.id] =
        service.price != null ? String(service.price) : ''
    }

    // Sugere o menor ciclo entre os serviços selecionados
    const ids = Object.keys(next)
    if (ids.length > 0) {
      const minCycle = Math.min(
        ...ids.map((id) => services.find((s) => s.id === id)?.cycle_days ?? 30)
      )
      setValue('expectedReturnDays', String(minCycle))
    } else {
      setValue('expectedReturnDays', '')
    }

    return next
  })
}

  function updateServicePrice(serviceId: string, price: string) {
    setSelectedServices((prev) => ({ ...prev, [serviceId]: price }))
  }

  const total = Object.values(selectedServices).reduce(
    (acc, p) => acc + (Number(p) || 0),
    0
  )

  async function onSubmit(values: FormValues) {
    const items = Object.entries(selectedServices).map(([serviceId, price]) => ({
      serviceId,
      price,
    }))

    const result = await saveVisit({ ...values, items })
    if (result?.error) {
      toast.error(result.error)
      return
    }
    toast.success('Atendimento registrado.')
    router.push(`/app/clientes/${values.clientId}`)
    router.refresh()
  }

  const selectedCount = Object.keys(selectedServices).length
  const selectedClient = clients.find((c) => c.id === clientId)

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/app/atendimentos')}
        className="-ml-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Novo atendimento</h1>
        <p className="text-sm text-muted-foreground">
          Registre o atendimento em poucos toques.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Cliente */}
        <div className="space-y-2">
          <Label>Cliente</Label>
          <Input
            placeholder="Buscar cliente..."
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
          />
          {selectedClient ? (
            <p className="text-sm text-muted-foreground">
              Selecionada: <strong>{selectedClient.name}</strong>{' '}
              <button
                type="button"
                className="underline"
                onClick={() => {
                  setValue('clientId', '')
                  setClientSearch('')
                }}
              >
                trocar
              </button>
            </p>
          ) : (
            <div className="max-h-40 overflow-y-auto rounded-md border">
              {clients.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  {clientSearch ? 'Nenhuma cliente encontrada' : 'Carregando...'}
                </p>
              ) : (
                clients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setValue('clientId', c.id)
                      setClientSearch('')
                    }}
                  >
                    {c.name}
                  </button>
                ))
              )}
            </div>
          )}
          <input type="hidden" {...register('clientId')} />
          {errors.clientId && (
            <p className="text-sm text-destructive">{errors.clientId.message}</p>
          )}
        </div>

        {/* Data */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="visitedAt">Data do atendimento</Label>
            <Input id="visitedAt" type="date" {...register('visitedAt')} />
          </div>
         <div className="space-y-2">
  <Label htmlFor="expectedReturnDays">Retorno em (dias)</Label>
  <Input
    id="expectedReturnDays"
    type="number"
    min="1"
    inputMode="numeric"
    placeholder="Ex.: 30"
    {...register('expectedReturnDays')}
  />
  <p className="text-xs text-muted-foreground">
    {previewReturn
      ? `Retorno previsto para ${previewReturn}.`
      : 'Preenchido automaticamente pelo menor ciclo dos serviços selecionados.'}
  </p>
</div>
        </div>

        {/* Serviços */}
        <div className="space-y-2">
          <Label>Serviços</Label>
          {services.length === 0 ? (
            <p className="rounded-md border p-3 text-sm text-muted-foreground">
              Cadastre serviços antes de registrar atendimentos.
            </p>
          ) : (
            <div className="space-y-2 rounded-md border p-3">
              {services.map((service) => {
                const selected = selectedServices[service.id] !== undefined
                return (
                  <div
                    key={service.id}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <input
                      type="checkbox"
                      id={`service-${service.id}`}
                      checked={selected}
                      onChange={() => toggleService(service)}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor={`service-${service.id}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {service.name}
                    </label>
                    {selected && (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        placeholder="Preço"
                        className="w-28"
                        value={selectedServices[service.id]}
                        onChange={(e) =>
                          updateServicePrice(service.id, e.target.value)
                        }
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {selectedCount === 0 && (
            <p className="text-xs text-muted-foreground">
              Selecione pelo menos um serviço.
            </p>
          )}
          <p className="text-sm font-medium">
            Total: <span className="text-primary">{formatBRL(total)}</span>
          </p>
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            rows={3}
            placeholder="Preferências, produtos usados, pedidos especiais..."
            {...register('notes')}
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || selectedCount === 0}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? 'Salvando...' : 'Registrar atendimento'}
        </Button>
      </form>
    </div>
  )
}