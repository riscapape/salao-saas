import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export type SalonInfo = {
  id: string
  name: string
  whatsapp: string | null
  bday_benefit_type: 'none' | 'percent' | 'amount' | 'free_service' | 'other'
  bday_benefit_value: number | null
  bday_benefit_desc: string | null
  bday_valid_until: string | null
}

export type SalonContext = {
  supabase: SupabaseClient
  user: User
  salonId: string | null
  role: 'owner' | 'staff' | null
  salon: SalonInfo | null
}

export async function getSalonContext(): Promise<SalonContext | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: membership } = await supabase
    .from('salon_members')
    .select(
      'salon_id, role, salon:salons(id, name, whatsapp, bday_benefit_type, bday_benefit_value, bday_benefit_desc, bday_valid_until)'
    )
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) {
    return { supabase, user, salonId: null, role: null, salon: null }
  }

  const salonRaw = membership.salon as unknown
  const salon = (Array.isArray(salonRaw) ? salonRaw[0] : salonRaw) as SalonInfo

  return {
    supabase,
    user,
    salonId: membership.salon_id,
    role: membership.role as 'owner' | 'staff',
    salon,
  }
}