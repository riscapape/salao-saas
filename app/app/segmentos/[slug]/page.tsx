import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft,
  Cake,
  CalendarClock,
  HeartHandshake,
  Sprout,
} from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { getSalonContext } from '@/lib/salon'
import { fetchSegmentClients } from '@/lib/segment-data'
import {
  segmentClients,
  segmentMeta,
  type SegmentClient,
  type SegmentKey,
} from '@/lib/segments'
import { formatShortDate, todayInSaoPaulo } from '@/lib/dates'
import { formatWhatsApp } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ClientWhatsActions } from '@/components/whatsapp-actions'
import {
  BenefitSummary,
  BirthdaySettingsDialog,
} from '@/components/birthday-settings-dialog'

const segmentIcons: Record<SegmentKey, LucideIcon> = {
  birthday: Cake,
  return: CalendarClock,
  reactivation: HeartHandshake,
  new_client: Sprout,
}

const validSlugs: SegmentKey[] = [
  'birthday',
  'return',
  'reactivation',
  'new_client',
]

function SituationBadge({
  slug,
  client,
}: {
  slug: SegmentKey
  client: SegmentClient
}): ReactNode {
  if (slug === 'birthday') {
    const d = client.daysUntilBirthday ?? 0
    if (d === 0) return <Badge>🎉 É hoje!</Badge>
    if (d > 0) return <Badge variant="secondary">em {d} dia(s)</Badge>
    return <Badge variant="outline">foi há {Math.abs(d)} dia(s)</Badge>
  }
  if (slug === 'return') {
    const d = client.overdueDays ?? 0
    if (d === 0) return <Badge>Retorno hoje</Badge>
    return <Badge variant="secondary">vencido há {d} dia(s)</Badge>
  }
  if (slug === 'reactivation') {
    return (
      <Badge variant="secondary">
        há {client.daysSinceLastVisit} dia(s) sem vir
      </Badge>
    )
  }
  return (
    <Badge variant="outline">
      1ª visita: {formatShortDate(client.firstVisit)}
    </Badge>
  )
}

export default async function SegmentoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const ctx = await getSalonContext()
  if (!ctx) redirect('/login')
  if (!ctx.salonId || !ctx.salon) redirect('/onboarding')

  const { slug } = await params
  if (!validSlugs.includes(slug as SegmentKey)) notFound()
  const key = slug as SegmentKey

  const clients = await fetchSegmentClients(ctx)
  const segments = segmentClients(clients, todayInSaoPaulo())
  const list = segments[key]
  const meta = segmentMeta[key]
  const Icon = segmentIcons[key]

  // Nome da profissional logada (assinatura das mensagens)
  const { data: profile } = await ctx.supabase
    .from('profiles')
    .select('full_name')
    .eq('id', ctx.user.id)
    .maybeSingle()
  const professionalName =
    profile?.full_name?.trim().split(/\s+/)[0] || 'a equipe'

  // Último contato de cada cliente (carência + "Voltou!")
  const { data: logs } = await ctx.supabase
    .from('message_logs')
    .select('client_id, sent_at, converted')
    .eq('salon_id', ctx.salonId)
    .order('sent_at', { ascending: false })
    .limit(2000)

  const contactByClient = new Map<
    string,
    { sentAt: string; converted: boolean }
  >()
  for (const l of logs ?? []) {
    if (!contactByClient.has(l.client_id)) {
      contactByClient.set(l.client_id, {
        sentAt: l.sent_at,
        converted: !!l.converted,
      })
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/app"
        className="inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground -ml-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border bg-background p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{meta.title}</h1>
            <p className="text-sm text-muted-foreground">
              {meta.description} · {list.length} cliente(s)
            </p>
          </div>
        </div>
        {key === 'birthday' && ctx.role === 'owner' && (
          <BirthdaySettingsDialog salon={ctx.salon} />
        )}
      </div>

      {key === 'birthday' && <BenefitSummary salon={ctx.salon} />}

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-background p-10 text-center">
          <p className="font-medium">Nenhuma cliente aqui ✨</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Este segmento está vazio no momento.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden rounded-lg border bg-background md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">WhatsApp</th>
                  <th className="px-4 py-3 font-medium">Situação</th>
                  <th className="px-4 py-3 font-medium">Último serviço</th>
                  <th className="px-4 py-3 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {list.map((client) => {
                  const contact = contactByClient.get(client.id)
                  return (
                    <tr key={client.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/app/clientes/${client.id}`}
                          className="font-medium hover:underline"
                        >
                          {client.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {formatWhatsApp(client.whatsapp)}
                      </td>
                      <td className="px-4 py-3">
                        <SituationBadge slug={key} client={client} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {client.lastServiceName ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <ClientWhatsActions
                          client={client}
                          segment={key}
                          salon={ctx.salon!}
                          professionalName={professionalName}
                          lastSentAt={contact?.sentAt ?? null}
                          converted={contact?.converted ?? false}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="space-y-3 md:hidden">
            {list.map((client) => {
              const contact = contactByClient.get(client.id)
              return (
                <div
                  key={client.id}
                  className="rounded-lg border bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/app/clientes/${client.id}`}
                      className="font-medium hover:underline"
                    >
                      {client.name}
                    </Link>
                    <SituationBadge slug={key} client={client} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatWhatsApp(client.whatsapp)}
                    {client.lastServiceName && ` · ${client.lastServiceName}`}
                  </p>
                  <div className="mt-3">
                    <ClientWhatsActions
                      client={client}
                      segment={key}
                      salon={ctx.salon!}
                      professionalName={professionalName}
                      lastSentAt={contact?.sentAt ?? null}
                      converted={contact?.converted ?? false}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}