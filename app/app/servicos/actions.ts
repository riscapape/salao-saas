'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSalonContext } from '@/lib/salon'

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, 'Informe o nome do serviço'),
  price: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z.number().min(0, 'Preço inválido').nullable()
  ),
  cycleDays: z.preprocess(
    (v) => Number(v),
    z.number().int().min(1, 'Informe o ciclo em dias').max(365, 'Ciclo muito alto')
  ),
})

export type ServiceInput = {
  id?: string
  name: string
  price: string
  cycleDays: string
}

export async function saveService(
  input: ServiceInput
): Promise<{ error?: string } | undefined> {
  const ctx = await getSalonContext()
  if (!ctx) return { error: 'Sessão expirada. Faça login novamente.' }
  if (!ctx.salonId) return { error: 'Salão não encontrado.' }

  const parsed = schema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const payload = {
    salon_id: ctx.salonId,
    name: parsed.data.name,
    price: parsed.data.price,
    cycle_days: parsed.data.cycleDays,
  }

  const { error } = parsed.data.id
    ? await ctx.supabase.from('services').update(payload).eq('id', parsed.data.id)
    : await ctx.supabase.from('services').insert(payload)

  if (error) {
    console.error('Erro ao salvar serviço:', error)
    return { error: 'Não foi possível salvar. Tente novamente.' }
  }

  revalidatePath('/app/servicos')
  return {}
}

export async function deleteService(
  id: string
): Promise<{ error?: string } | undefined> {
  const ctx = await getSalonContext()
  if (!ctx) return { error: 'Sessão expirada. Faça login novamente.' }
  if (ctx.role !== 'owner') return { error: 'Apenas a dona do salão pode excluir.' }

  const { error } = await ctx.supabase.from('services').delete().eq('id', id)

  if (error) {
    console.error('Erro ao excluir serviço:', error)
    return { error: 'Não foi possível excluir (o serviço já tem atendimentos registrados).' }
  }

  revalidatePath('/app/servicos')
  return {}
}