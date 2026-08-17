import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  Cake,
  CalendarClock,
  ChevronRight,
  HeartHandshake,
  Plus,
  Sprout,
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { getSalonContext } from '@/lib/salon'
import { fetchSegmentClients } from '@/lib/segment-data'
import {
  buildDailyQueue,
  segmentClients,
  type SegmentKey,
} from '@/lib/segments'
import { todayInSaoPaulo } from '@/lib/dates'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const segmentIcons: Record<SegmentKey, LucideIcon> = {
  birthday: Cake,
  return: CalendarClock,
  reactivation: HeartHandshake,
  new_client: Sprout,
}

const segmentCards: { key: SegmentKey; label: string }[] = [
  { key: 'birthday', label: 'Aniversariantes' },
  { key: 'return', label: 'Retorno previsto' },
  { key: 'reactivation', label: 'Reativação' },
  { key: 'new_client', label: 'Novas clientes' },
]

export default async function DashboardPage() {
  const ctx = await getSalonContext()
  if (!ctx) redirect('/login')
  if (!ctx.salonId) redirect('/onboarding')

  const clients = await fetchSegmentClients(ctx)
  const segments = segmentClients(clients, todayInSaoPaulo())
  const queue = buildDailyQueue(segments)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Visão do dia</h1>
          <p className="text-sm text-muted-foreground">
            {clients.length} cliente(s) ativa(s) no salão.
          </p>
        </div>
        <Link
          href="/app/atendimentos/novo"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo atendimento
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {segmentCards.map(({ key, label }) => {
          const Icon = segmentIcons[key]
          const count = segments[key].length
          return (
            <Link key={key} href={`/app/segmentos/${key}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <Icon className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{count}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Fila do dia</h2>
          <p className="text-xs text-muted-foreground">
            Quem chamar primeiro hoje
          </p>
        </div>

        {queue.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-background p-8 text-center">
            <p className="font-medium">Tudo em dia ✨</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nenhuma cliente precisa de contato hoje.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {queue.map((item) => (
              <Link
                key={item.client.id}
                href={`/app/clientes/${item.client.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="font-medium">{item.client.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {item.reason}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}