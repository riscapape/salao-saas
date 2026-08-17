import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { SalonContext } from '@/lib/salon'
import type { SegmentClient } from '@/lib/segments'
import { todayInSaoPaulo } from '@/lib/dates'

export async function fetchSegmentClients(
  ctx: SalonContext
): Promise<SegmentClient[]> {
  if (!ctx.salonId) return []

  const { data: clients } = await ctx.supabase
    .from('clients')
    .select('id, name, whatsapp, birthday, notes')
    .eq('salon_id', ctx.salonId)
    .eq('status', 'active')
    .order('name')

  const list = clients ?? []
  if (list.length === 0) return []

  const ids = list.map((c) => c.id)

  const { data: stats } = await ctx.supabase
    .from('client_last_visit')
    .select('client_id, last_visit, first_visit, visit_count, last_expected_return')
    .in('client_id', ids)

  const statsById = new Map((stats ?? []).map((s) => [s.client_id, s]))

  // Última visita de cada cliente + serviços (fallback de ciclo e contexto)
  const { data: visits } = await ctx.supabase
    .from('visits')
    .select('client_id, visited_at, visit_services(services(name, cycle_days))')
    .eq('salon_id', ctx.salonId)
    .order('visited_at', { ascending: false })

  const lastServiceInfo = new Map<
    string,
    { serviceName: string | null; cycleDays: number | null }
  >()

  for (const v of visits ?? []) {
  if (lastServiceInfo.has(v.client_id)) continue

  const items = (v.visit_services ?? []) as any[]
  const names: string[] = []
  const cycles: number[] = []

  for (const item of items) {
    // O embed pode vir como objeto ou array — normalizamos os dois casos
    const svc = Array.isArray(item?.services) ? item.services[0] : item?.services
    if (svc?.name) names.push(svc.name)
    if (typeof svc?.cycle_days === 'number') cycles.push(svc.cycle_days)
  }

  lastServiceInfo.set(v.client_id, {
    serviceName: names.length > 0 ? names.join(' + ') : null,
    cycleDays: cycles.length > 0 ? Math.min(...cycles) : null,
  })
}

  const today = todayInSaoPaulo()

  return list.map((c) => {
    const s = statsById.get(c.id)
    const info = lastServiceInfo.get(c.id)
    const lastVisit = s?.last_visit ?? null
    return {
      id: c.id,
      name: c.name,
      whatsapp: c.whatsapp,
      birthday: c.birthday,
      notes: c.notes,
      lastVisit,
      lastExpectedReturn: s?.last_expected_return ?? null,
      firstVisit: s?.first_visit ?? null,
      visitCount: s?.visit_count ?? 0,
      daysSinceLastVisit: lastVisit
        ? differenceInCalendarDays(today, parseISO(lastVisit))
        : null,
      overdueDays: null,
      daysUntilBirthday: null,
      lastServiceName: info?.serviceName ?? null,
      lastServiceCycleDays: info?.cycleDays ?? null,
    }
  })
}