import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MessageCircle, Plus } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getSalonContext } from '@/lib/salon'
import { daysSince, formatShortDate } from '@/lib/dates'
import { formatBRL, formatWhatsApp } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const ctx = await getSalonContext()
  if (!ctx) redirect('/login')
  if (!ctx.salonId) redirect('/onboarding')

  const { id } = await params
  const { data: client } = await ctx.supabase
    .from('clients')
    .select('id, name, whatsapp, birthday, notes')
    .eq('id', id)
    .eq('salon_id', ctx.salonId)
    .single()

  if (!client) notFound()

  const { data: visits } = await ctx.supabase
    .from('visits')
    .select(
      'id, visited_at, total, notes, expected_return, profiles(full_name), visit_services(price, services(name))'
    )
    .eq('client_id', id)
    .order('visited_at', { ascending: false })

  const list = visits ?? []
  const lastVisit = list[0]
  const days = daysSince(lastVisit?.visited_at)
  const totalSpent = list.reduce((acc, v) => acc + (v.total ?? 0), 0)

  return (
    <div className="space-y-6">
    <Link
  href="/app/clientes"
  className="inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground -ml-2"
>
  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
</Link>
      <div>
        <h1 className="text-2xl font-semibold">{client.name}</h1>
        <p className="text-sm text-muted-foreground">
          {formatWhatsApp(client.whatsapp)}
          {client.birthday && ` · 🎂 ${formatShortDate(client.birthday)}`}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-background p-4">
          <p className="text-xs text-muted-foreground">Última visita</p>
          <p className="font-semibold">
            {lastVisit ? formatShortDate(lastVisit.visited_at) : '—'}
          </p>
          <p className="text-xs text-muted-foreground">
            {days === null ? 'sem registros' : `há ${days} dia(s)`}
          </p>
        </div>
        <div className="rounded-lg border bg-background p-4">
          <p className="text-xs text-muted-foreground">Visitas</p>
          <p className="font-semibold">{list.length}</p>
        </div>
        <div className="rounded-lg border bg-background p-4">
          <p className="text-xs text-muted-foreground">Total gasto</p>
          <p className="font-semibold">{formatBRL(totalSpent)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
       <Link
  href={`/app/atendimentos/novo?client=${client.id}`}
  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
>
  <Plus className="mr-2 h-4 w-4" /> Novo atendimento
</Link>
       <a
  href={`https://wa.me/${client.whatsapp}`}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
>
  <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
</a>
      </div>

      {client.notes && (
        <div className="rounded-lg border bg-background p-4">
          <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
            Observações
          </p>
          <p className="whitespace-pre-wrap text-sm">{client.notes}</p>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Histórico de atendimentos</h2>
        {list.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-background p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum atendimento registrado ainda.
            </p>
          </div>
        ) : (
          list.map((v: any) => (
            <div key={v.id} className="rounded-lg border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {formatShortDate(v.visited_at)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Atendida por {v.profiles?.full_name ?? '—'}
                  </p>
                </div>
                <Badge>{formatBRL(v.total)}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {v.visit_services?.map((vs: any, idx: number) => (
                  <Badge key={idx} variant="outline">
                    {vs.services?.name}
                  </Badge>
                ))}
              </div>
              {v.expected_return && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Retorno previsto: {formatShortDate(v.expected_return)}
                </p>
              )}
              {v.notes && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {v.notes}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}