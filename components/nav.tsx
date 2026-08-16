'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CircleUserRound,
  ClipboardList,
  Home,
  Sparkles,
  Users,
  UsersRound,
} from 'lucide-react'
import { LogoutButton } from '@/components/logout-button'

const baseItems = [
  { href: '/app', label: 'Início', short: 'Início', icon: Home },
  { href: '/app/clientes', label: 'Clientes', short: 'Clientes', icon: Users },
  { href: '/app/atendimentos', label: 'Atendimentos', short: 'Atend.', icon: ClipboardList },
  { href: '/app/servicos', label: 'Serviços', short: 'Serviços', icon: Sparkles },
]

const ownerItems = [
  { href: '/app/equipe', label: 'Equipe', short: 'Equipe', icon: UsersRound },
]

const accountItem = { href: '/app/conta', label: 'Minha conta', short: 'Conta', icon: CircleUserRound }

function isActive(pathname: string, href: string) {
  return href === '/app' ? pathname === '/app' : pathname.startsWith(href)
}

function itemsFor(role: string) {
  return role === 'owner' ? [...baseItems, ...ownerItems, accountItem] : [...baseItems, accountItem]
}

export function DesktopSidebar({ salonName, role }: { salonName: string; role: string }) {
  const pathname = usePathname()
  const items = itemsFor(role)

  return (
    <aside className="sticky top-0 hidden h-screen w-60 flex-col border-r bg-background md:flex">
      <div className="p-6">
        <p className="text-lg font-semibold leading-tight">{salonName}</p>
        <p className="text-xs text-muted-foreground">Painel do salão</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-3">
        <LogoutButton />
      </div>
    </aside>
  )
}

export function MobileHeader({ salonName }: { salonName: string }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
      <p className="font-semibold">{salonName}</p>
      <Link href="/app/conta" className="text-muted-foreground">
        <CircleUserRound className="h-6 w-6" />
      </Link>
    </header>
  )
}

export function MobileNav({ role }: { role: string }) {
  const pathname = usePathname()
  const items = itemsFor(role)

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid border-t bg-background md:hidden"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 py-2 text-[11px] ${
              active ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.short}
          </Link>
        )
      })}
    </nav>
  )
}