import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AppHome() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { count } = await supabase
    .from('salon_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (!count) redirect('/onboarding')

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Tudo pronto por aqui 🎉</h1>
      <p className="text-muted-foreground">
        O dashboard chega na Fase 4. Próximo passo: clientes e serviços.
      </p>
    </div>
  )
}