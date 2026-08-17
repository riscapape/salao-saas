'use server'

import { revalidatePath } from 'next/cache'
import { addDays, format, parseISO } from 'date-fns'
import { z } from 'zod'
import { getSalonContext } from '@/lib/salon'

const itemSchema = z.object({
  serviceId: z.string().uuid(),
  price: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z.number().min(0).nullable()
  ),
})

const schema = z.object({
  clientId: z.string().uuid('Selecione uma cliente'),
  visitedAt: z.string().min(1, 'Informe a data'),
  expectedReturnDays: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z.number().int().min(1, 'Dias inválido').max(365, 'Máximo de 365 dias').nullable()
  ),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Selecione pelo menos um serviço'),
})

export type VisitInput = {
  clientId: string
  visitedAt: string
  expectedReturnDays?: string
  notes?: string
  items: { serviceId: string; price: string | number }[]
}

export async function saveVisit(
  input: VisitInput
): Promise<{ error?: string; visitId?: string } | undefined> {
  const ctx = await getSalonContext()
  if (!ctx) return { error: 'Sessão expirada. Faça login novamente.' }
  if (!ctx.salonId) return { error: 'Salão não encontrado.' }

  const parsed = schema.safeParse({
    ...input,
    items: input.items.map((i) => ({
      serviceId: i.serviceId,
      price: typeof i.price === 'string' ? i.price : String(i.price),
    })),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Converte "X dias" em data de retorno previsto
  let expectedReturn: string | null = null
  if (parsed.data.expectedReturnDays != null) {
    expectedReturn = format(
      addDays(parseISO(parsed.data.visitedAt), parsed.data.expectedReturnDays),
      'yyyy-MM-dd'
    )
  }

  const total = parsed.data.items.reduce(
    (acc, i) => acc + (i.price ?? 0),
    0
  )

  const { data: visit, error: visitErr } = await ctx.supabase
    .from('visits')
    .insert({
      salon_id: ctx.salonId,
      client_id: parsed.data.clientId,
      visited_at: parsed.data.visitedAt,
      expected_return: expectedReturn,
      total,
      notes: parsed.data.notes || null,
      created_by: ctx.user.id,
    })
    .select('id')
    .single()

  if (visitErr || !visit) {
    console.error('Erro ao criar atendimento:', visitErr)
    return { error: 'Não foi possível salvar o atendimento.' }
  }

  const { error: itemsErr } = await ctx.supabase.from('visit_services').insert(
    parsed.data.items.map((i) => ({
      visit_id: visit.id,
      service_id: i.serviceId,
      price: i.price,
    }))
  )

  if (itemsErr) {
    console.error('Erro ao salvar serviços do atendimento:', itemsErr)
    await ctx.supabase.from('visits').delete().eq('id', visit.id)
    return { error: 'Não foi possível salvar os serviços.' }
  }

  revalidatePath('/app/atendimentos')
  revalidatePath('/app/clientes')
  revalidatePath(`/app/clientes/${parsed.data.clientId}`)
  return { visitId: visit.id }
}

export async function deleteVisit(
  id: string
): Promise<{ error?: string } | undefined> {
  const ctx = await getSalonContext()
  if (!ctx) return { error: 'Sessão expirada. Faça login novamente.' }
  if (ctx.role !== 'owner') return { error: 'Apenas a dona do salão pode excluir.' }

  const { error } = await ctx.supabase.from('visits').delete().eq('id', id)
  if (error) {
    console.error('Erro ao excluir atendimento:', error)
    return { error: 'Não foi possível excluir.' }
  }
  revalidatePath('/app/atendimentos')
  return {}
}