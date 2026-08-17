import { differenceInCalendarDays, format, parseISO } from 'date-fns'

export function daysSince(date: string | null | undefined): number | null {
  if (!date) return null
  return differenceInCalendarDays(new Date(), parseISO(date))
}

export function formatShortDate(date: string | null | undefined): string {
  if (!date) return '—'
  return format(parseISO(date), 'dd/MM/yyyy')
}
export function todayInSaoPaulo(): Date {
  return new Date(
    new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }) +
      'T00:00:00'
  )
}