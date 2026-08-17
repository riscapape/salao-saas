import Link from 'next/link'
import { Plus } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getSalonContext } from '@/lib/salon'
import { formatBRL } from '@/lib/utils'
import { formatShortDate } from '@/lib/dates'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function AtendimentosPage() {
  const ctx = await getSalonContext()
  if (!ctx) redirect('/login')
  if (!ctx.salonId) redirect('/onboarding')

  const { data: visits } = await ctx.supabase
    .from('visits')
    .select('id, visited_at, total, clients!inner(name)')
    .eq('salon_id', ctx.salonId)
    .order('visited_at', { ascending: false })
    .limit(50)

  const list = visits ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Atendimentos</h1>
          <p className="text-sm text-muted-foreground">Últimos 50 registros.</p>
        </div>
        <Link
  href="/app/atendimentos/novo"
  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
>
  <Plus className="mr-2 h-4 w-4" /> Novo atendimento
</Link>
      </div>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-background p-10 text-center">
          <p className="font-medium">Nenhum atendimento ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Registre o primeiro atendimento no botão acima.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden rounded-lg border bg-background md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell>{formatShortDate(v.visited_at)}</TableCell>
                    <TableCell>
                      <Link
                        href={`/app/clientes/${v.clients.id}`}
                        className="font-medium hover:underline"
                      >
                        {v.clients.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatBRL(v.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {list.map((v: any) => (
              <Link
                key={v.id}
                href={`/app/clientes/${v.clients.id}`}
                className="block rounded-lg border bg-background p-4 hover:bg-muted/50"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">{v.clients.name}</p>
                  <p className="text-sm">{formatShortDate(v.visited_at)}</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatBRL(v.total)}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}