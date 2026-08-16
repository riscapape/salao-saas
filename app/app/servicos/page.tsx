import { redirect } from 'next/navigation'
import { getSalonContext } from '@/lib/salon'
import { formatBRL } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ServiceDialog, type ServiceData } from '@/components/services/service-dialog'

export default async function ServicosPage() {
  const ctx = await getSalonContext()
  if (!ctx) redirect('/login')
  if (!ctx.salonId) redirect('/onboarding')

  const { data: services } = await ctx.supabase
    .from('services')
    .select('id, name, price, cycle_days')
    .eq('salon_id', ctx.salonId)
    .order('name')

  const list: ServiceData[] = services ?? []
  const canDelete = ctx.role === 'owner'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Serviços</h1>
          <p className="text-sm text-muted-foreground">
            O ciclo de retorno é só uma sugestão para agilizar o atendimento.
          </p>
        </div>
        <ServiceDialog canDelete={canDelete} />
      </div>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-background p-10 text-center">
          <p className="font-medium">Nenhum serviço ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre os serviços que o salão oferece.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden rounded-lg border bg-background md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Retorno sugerido</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{formatBRL(service.price)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">a cada {service.cycle_days} dias</Badge>
                    </TableCell>
                    <TableCell>
                      <ServiceDialog service={service} canDelete={canDelete} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="space-y-3 md:hidden">
            {list.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between gap-2 rounded-lg border bg-background p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatBRL(service.price)} · a cada {service.cycle_days} dias
                  </p>
                </div>
                <ServiceDialog service={service} canDelete={canDelete} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}