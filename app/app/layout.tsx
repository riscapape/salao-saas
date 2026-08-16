import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getSalonContext } from '@/lib/salon'
import { DesktopSidebar, MobileHeader, MobileNav } from '@/components/nav'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const ctx = await getSalonContext()
  if (!ctx) redirect('/login')
  if (!ctx.salonId) redirect('/onboarding')

  const salonName = ctx.salon?.name ?? ''

  return (
    <div className="min-h-screen bg-muted/30 md:flex">
      <DesktopSidebar salonName={salonName} role={ctx.role ?? 'staff'} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader salonName={salonName} />
        <main className="mx-auto w-full max-w-5xl flex-1 p-4 pb-24 md:p-8">
          {children}
        </main>
      </div>
      <MobileNav role={ctx.role ?? 'staff'} />
    </div>
  )
}