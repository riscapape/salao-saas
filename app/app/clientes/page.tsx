import { Search } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getSalonContext } from '@/lib/salon'
import { daysSince, formatShortDate } from '@/lib/dates'
import { formatWhatsApp } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ClientDialog, type ClientData } from '@/components/clients/client-dialog'
import Link from 'next/link'

function LastVisitBadge({ lastVisit }: { lastVisit?: string }) {
  const days = daysSince(lastVisit ?? null)
  if (days === null) return <Badge variant="outline">Sem visitas</Badge>
  if (days === 0) return <Badge>Atendida hoje</Badge>
  return <Badge variant="secondary">há {days} dia(s)</Badge>
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const ctx = await getSalonContext()
  if (!ctx) redirect('/login')
  if (!ctx.salonId) redirect('/onboarding')

  const { q = '' } = await searchParams

  const query = ctx.supabase
    .from('clients')
    .select('id, name, whatsapp, birthday, notes')
    .eq('salon_id', ctx.salonId)
    .order('name')

  if (q.trim()) query.ilike('name', `%${q.trim()}%`)

  const { data: clients } = await query
  const list: ClientData[] = clients ?? []

  const lastVisitByClient = new Map<string, string>()
  if (list.length > 0) {
    const { data: visits } = await ctx.supabase
      .from('client_last_visit')
      .select('client_id, last_visit')
      .in('client_id', list.map((c) => c.id))
    for (const v of visits ?? []) {
      if (v.last_visit) lastVisitByClient.set(v.client_id, v.last_visit)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {list.length} cliente(s){q.trim() ? ' encontrada(s)' : ' cadastrada(s)'}
          </p>
        </div>
        <ClientDialog />
      </div>

      <form action="/app/clientes" className="flex max-w-sm gap-2">
        <Input name="q" defaultValue={q} placeholder="Buscar por nome..." />
        <Button type="submit" variant="secondary">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-background p-10 text-center">
          <p className="font-medium">
            {q.trim() ? 'Nenhuma cliente encontrada' : 'Nenhuma cliente ainda'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {q.trim()
              ? 'Tente outra busca.'
              : 'Cadastre a primeira cliente no botão acima.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden rounded-lg border bg-background md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Aniversário</TableHead>
                  <TableHead>Última visita</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((client) => (
                  <TableRow key={client.id}>
                                      <TableCell>
                      <Link
                        href={`/app/clientes/${client.id}`}
                        className="font-medium hover:underline"
                      >
                        {client.name}
                      </Link>
                    </TableCell>
                    <TableCell>{formatWhatsApp(client.whatsapp)}</TableCell>
                    <TableCell>{formatShortDate(client.birthday)}</TableCell>
                    <TableCell>
                      <LastVisitBadge lastVisit={lastVisitByClient.get(client.id)} />
                    </TableCell>
                    <TableCell>
                      <ClientDialog client={client} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="space-y-3 md:hidden">
            {list.map((client) => (
              <div key={client.id} className="rounded-lg border bg-background p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                   <Link
                    href={`/app/clientes/${client.id}`}
                    className="font-medium hover:underline"
                  >
                    {client.name}
                  </Link>
                    <p className="text-sm text-muted-foreground">
                      {formatWhatsApp(client.whatsapp)}
                    </p>
                  </div>
                  <ClientDialog client={client} />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <LastVisitBadge lastVisit={lastVisitByClient.get(client.id)} />
                  {client.birthday && (
                    <Badge variant="outline">🎂 {formatShortDate(client.birthday)}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}