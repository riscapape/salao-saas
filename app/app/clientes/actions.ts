'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSalonContext } from '@/lib/salon'
import { onlyDigits } from '@/lib/utils'

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, 'Informe o nome'),
  whatsapp: z.string().min(10, 'WhatsApp incompleto'),
  birthday: z.string().optional(),
  notes: z.string().optional(),
})

export type ClientInput = {
  id?: string
  name: string
  whatsapp: string
  birthday?: string
  notes?: string
}

export async function saveClient(
  input: ClientInput
): Promise<{ error?: string } | undefined> {
  const ctx = await getSalonContext()
  if (!ctx) return { error: 'Sessão expirada. Faça login novamente.' }
  if (!ctx.salonId) return { error: 'Salão não encontrado.' }

  const parsed = schema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const payload = {
    salon_id: ctx.salonId,
    name: parsed.data.name,
    whatsapp: onlyDigits(parsed.data.whatsapp),
    birthday: parsed.data.birthday || null,
    notes: parsed.data.notes || null,
  }

  const { error } = parsed.data.id
    ? await ctx.supabase.from('clients').update(payload).eq('id', parsed.data.id)
    : await ctx.supabase.from('clients').insert(payload)

  if (error) {
    console.error('Erro ao salvar cliente:', error)
    return { error: 'Não foi possível salvar. Tente novamente.' }
  }

  revalidatePath('/app/clientes')
  return {}
}