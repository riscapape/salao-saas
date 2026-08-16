import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export type SalonContext = {
  supabase: SupabaseClient
  user: User
  salonId: string | null
  role: 'owner' | 'staff' | null
  salon: { id: string; name: string; whatsapp: string | null } | null
}

export async function getSalonContext(): Promise<SalonContext | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: membership } = await supabase
    .from('salon_members')
    .select('salon_id, role, salon:salons(id, name, whatsapp)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) {
    return { supabase, user, salonId: null, role: null, salon: null }
  }

  // Sem types gerados, o Supabase tipa o join como array.
  // Em runtime é um objeto — normalizamos os dois casos.
  const salonRaw = membership.salon as unknown
  const salon = (Array.isArray(salonRaw) ? salonRaw[0] : salonRaw) as SalonContext['salon']

  return {
    supabase,
    user,
    salonId: membership.salon_id,
    role: membership.role as 'owner' | 'staff',
    salon,
  }
}