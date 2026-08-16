import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingForm } from './onboarding-form'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { count } = await supabase
    .from('salon_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (count) redirect('/app')

  return <OnboardingForm email={user.email ?? ''} />
}