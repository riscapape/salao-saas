import {
  addDays,
  differenceInCalendarDays,
  getDate,
  getMonth,
  parseISO,
} from 'date-fns'

export type SegmentKey = 'birthday' | 'return' | 'reactivation' | 'new_client'

export type SegmentClient = {
  id: string
  name: string
  whatsapp: string
  birthday: string | null
  notes: string | null
  lastVisit: string | null
  lastExpectedReturn: string | null
  firstVisit: string | null
  visitCount: number
  daysSinceLastVisit: number | null
  overdueDays: number | null
  daysUntilBirthday: number | null
  lastServiceName: string | null
  lastServiceCycleDays: number | null
}

export const segmentMeta: Record<
  SegmentKey,
  { title: string; description: string }
> = {
  birthday: {
    title: 'Aniversariantes do mês',
    description: 'Clientes que fazem aniversário neste mês.',
  },
  return: {
    title: 'Retorno previsto',
    description: 'O retorno previsto destas clientes já passou.',
  },
  reactivation: {
    title: 'Reativação',
    description: 'Clientes sem vir ao salão há 90 dias ou mais.',
  },
  new_client: {
    title: 'Novas clientes',
    description:
      'Fizeram a primeira visita há pouco tempo — a segunda visita fideliza.',
  },
}

export function segmentClients(
  clients: SegmentClient[],
  today: Date
): Record<SegmentKey, SegmentClient[]> {
  const result: Record<SegmentKey, SegmentClient[]> = {
    birthday: [],
    return: [],
    reactivation: [],
    new_client: [],
  }

  for (const c of clients) {
    // 🎂 Aniversário no mês atual
    if (c.birthday) {
      const b = parseISO(c.birthday)
      if (getMonth(b) === getMonth(today)) {
        result.birthday.push({
          ...c,
          daysUntilBirthday: getDate(b) - getDate(today),
        })
      }
    }

    // 🔁 Retorno previsto vencido (com fallback pelo ciclo do serviço)
    if (c.lastExpectedReturn) {
      const overdue = differenceInCalendarDays(
        today,
        parseISO(c.lastExpectedReturn)
      )
      if (overdue >= 0) result.return.push({ ...c, overdueDays: overdue })
    } else if (c.lastVisit && c.lastServiceCycleDays != null) {
      const due = addDays(parseISO(c.lastVisit), c.lastServiceCycleDays)
      const overdue = differenceInCalendarDays(today, due)
      if (overdue >= 0) result.return.push({ ...c, overdueDays: overdue })
    }

    // 😴 Reativação: 90+ dias sem vir
    if (c.daysSinceLastVisit != null && c.daysSinceLastVisit >= 90) {
      result.reactivation.push(c)
    }

    // 🌱 Nova cliente: exatamente 1 visita nos últimos 30 dias
    if (
      c.visitCount === 1 &&
      c.firstVisit &&
      differenceInCalendarDays(today, parseISO(c.firstVisit)) <= 30
    ) {
      result.new_client.push(c)
    }
  }

  result.birthday.sort(
    (a, b) => (a.daysUntilBirthday ?? 0) - (b.daysUntilBirthday ?? 0)
  )
  result.return.sort((a, b) => (b.overdueDays ?? 0) - (a.overdueDays ?? 0))
  result.reactivation.sort(
    (a, b) => (b.daysSinceLastVisit ?? 0) - (a.daysSinceLastVisit ?? 0)
  )
  result.new_client.sort((a, b) =>
    (a.firstVisit ?? '').localeCompare(b.firstVisit ?? '')
  )

  return result
}

export type QueueItem = {
  client: SegmentClient
  reason: string
}

export function buildDailyQueue(
  segments: Record<SegmentKey, SegmentClient[]>,
  limit = 5
): QueueItem[] {
  const seen = new Set<string>()
  const queue: QueueItem[] = []

  const push = (client: SegmentClient, reason: string) => {
    if (seen.has(client.id) || queue.length >= limit) return
    seen.add(client.id)
    queue.push({ client, reason })
  }

  for (const c of segments.birthday) {
    const d = c.daysUntilBirthday ?? 0
    push(
      c,
      d === 0
        ? '🎉 Aniversário hoje'
        : d > 0
          ? `Aniversário em ${d} dia(s)`
          : `Aniversário foi há ${Math.abs(d)} dia(s)`
    )
  }

  for (const c of segments.return) {
    push(
      c,
      c.overdueDays === 0
        ? 'Retorno previsto para hoje'
        : `Retorno vencido há ${c.overdueDays} dia(s)`
    )
  }

  for (const c of segments.reactivation) {
    push(c, `Há ${c.daysSinceLastVisit} dia(s) sem vir`)
  }

  return queue
}