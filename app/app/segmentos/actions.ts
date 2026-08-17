'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSalonContext } from '@/lib/salon'
import type { SegmentKey } from '@/lib/segments'

export async function markMessageSent(input: {
  clientId: string
  segment: SegmentKey
  message: string
}): Promise<{ error?: string } | undefined> {
  const ctx = await getSalonContext()
  if (!ctx || !ctx.salonId) return { error: 'Sessão expirada.' }

  const { error } = await ctx.supabase.from('message_logs').insert({
    salon_id: ctx.salonId,
    client_id: input.clientId,
    segment: input.segment,
    message: input.message,
  })

  if (error) {
    console.error('Erro ao registrar envio:', error)
    return { error: 'Não foi possível registrar o envio.' }
  }

  revalidatePath(`/app/segmentos/${input.segment}`)
  revalidatePath('/app')
  return {}
}

export async function markConverted(input: {
  clientId: string
  segment: SegmentKey
}): Promise<{ error?: string } | undefined> {
  const ctx = await getSalonContext()
  if (!ctx || !ctx.salonId) return { error: 'Sessão expirada.' }

  const { data: log } = await ctx.supabase
    .from('message_logs')
    .select('id')
    .eq('client_id', input.clientId)
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (log) {
    await ctx.supabase
      .from('message_logs')
      .update({ converted: true })
      .eq('id', log.id)
  }

  revalidatePath(`/app/segmentos/${input.segment}`)
  revalidatePath('/app')
  return {}
}

const settingsSchema = z.object({
  benefitType: z.enum(['none', 'percent', 'amount', 'free_service', 'other']),
  benefitValue: z.string(),
  benefitDesc: z.string(),
  validUntil: z.string(),
})

export async function saveBirthdaySettings(input: {
  benefitType: string
  benefitValue: string
  benefitDesc: string
  validUntil: string
}): Promise<{ error?: string } | undefined> {
  const ctx = await getSalonContext()
  if (!ctx || !ctx.salonId) return { error: 'Sessão expirada.' }
  if (ctx.role !== 'owner') return { error: 'Apenas a dona pode alterar.' }

  const parsed = settingsSchema.safeParse(input)
  if (!parsed.success) return { error: 'Dados inválidos.' }

  const { benefitType, benefitValue, benefitDesc, validUntil } = parsed.data

  let value: number | null = null
  if (benefitType === 'percent' || benefitType === 'amount') {
    value = Number(benefitValue)
    if (!Number.isFinite(value) || value <= 0) {
      return { error: 'Informe o valor do desconto.' }
    }
    if (benefitType === 'percent' && value > 100) {
      return { error: 'O percentual máximo é 100%.' }
    }
  }

  if (
    (benefitType === 'free_service' || benefitType === 'other') &&
    !benefitDesc.trim()
  ) {
    return { error: 'Descreva o benefício.' }
  }

  if (benefitType !== 'none' && !validUntil) {
    return { error: 'Informe a data limite para resgate.' }
  }

  const { error } = await ctx.supabase
    .from('salons')
    .update({
      bday_benefit_type: benefitType,
      bday_benefit_value: value,
      bday_benefit_desc: benefitDesc.trim() || null,
      bday_valid_until: validUntil || null,
    })
    .eq('id', ctx.salonId)

  if (error) {
    console.error('Erro ao salvar benefício:', error)
    return { error: 'Não foi possível salvar.' }
  }

  revalidatePath('/app/segmentos/birthday')
  revalidatePath('/app')
  return {}
}