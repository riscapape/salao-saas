'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { onlyDigits } from '@/lib/utils'

const schema = z.object({
  ownerName: z.string().trim().min(2, 'Informe seu nome'),
  salonName: z.string().trim().min(2, 'Informe o nome do salão'),
  whatsapp: z.string().min(10, 'WhatsApp incompleto'),
})

export type OnboardingState = { error?: string } | undefined

export async function createSalon(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const parsed = schema.safeParse({
    ownerName: formData.get('ownerName'),
    salonName: formData.get('salonName'),
    whatsapp: formData.get('whatsapp'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { ownerName, salonName } = parsed.data
  const whatsapp = onlyDigits(parsed.data.whatsapp)

  const { data: salon, error: salonError } = await supabase
    .from('salons')
    .insert({ owner_id: user.id, name: salonName, whatsapp })
    .select('id')
    .single()

  if (salonError || !salon) {
  console.error('Erro ao criar salão:', salonError)
  return { error: 'Não foi possível criar o salão. Tente novamente.' }
}

  const { error: memberError } = await supabase
    .from('salon_members')
    .insert({ salon_id: salon.id, user_id: user.id, role: 'owner' })

  if (memberError) {
    return { error: 'Não foi possível concluir a configuração. Tente novamente.' }
  }

  await supabase.from('profiles').update({ full_name: ownerName }).eq('id', user.id)

  revalidatePath('/app')
  redirect('/app')
}